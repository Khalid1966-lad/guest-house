/**
 * Dynamic model introspection for backup/restore.
 * Automatically discovers all Prisma models and determines
 * the correct insert/delete order based on foreign key dependencies.
 *
 * System tables (Account, Session, VerificationToken, Backup) are excluded.
 * New tables added to the Prisma schema are automatically included.
 */

// System tables that should NOT be backed up
const SYSTEM_TABLES = new Set([
  "Account",        // NextAuth OAuth accounts
  "Session",        // NextAuth sessions (ephemeral, user will re-login)
  "VerificationToken", // NextAuth email verification (ephemeral)
  "Backup",         // Backup metadata itself (circular dependency)
])

/**
 * Get the list of all business model names from Prisma client instance,
 * excluding system tables.
 * The casing is converted from camelCase (Prisma) to PascalCase (DB).
 */
export function getBackupModelNames(db: any): string[] {
  const models: string[] = []

  for (const key of Object.keys(db)) {
    if (key.startsWith("_") || key.startsWith("$")) continue
    const model = db[key]
    if (!model || typeof model !== "object") continue
    if (typeof model.findMany !== "function") continue
    if (typeof model.createMany !== "function") continue
    if (typeof model.deleteMany !== "function") continue

    // Convert camelCase to PascalCase
    const pascalName = key.charAt(0).toUpperCase() + key.slice(1)
    if (!SYSTEM_TABLES.has(pascalName)) {
      models.push(pascalName)
    }
  }

  return models
}

/**
 * Get camelCase model name from PascalCase.
 */
export function toModelName(pascal: string): string {
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * Dependency graph for insert order.
 * Maps: tableName → set of tables it depends on (must be inserted first).
 *
 * This is the single source of truth. If you add a new table with FK
 * dependencies, add it here. The backup system will automatically
 * topologically sort all models.
 */
export const DEPENDENCIES: Record<string, Set<string>> = {
  GuestHouseSetting: new Set(["GuestHouse"]),
  User: new Set([]),
  Role: new Set(["GuestHouse"]),
  Room: new Set(["GuestHouse"]),
  RoomPrice: new Set(["Room"]),
  Amenity: new Set(["GuestHouse"]),
  Guest: new Set(["GuestHouse"]),
  Booking: new Set(["GuestHouse", "Guest", "Room", "User"]),
  Invoice: new Set(["GuestHouse", "Guest", "User"]),
  InvoiceItem: new Set(["Invoice"]),
  Payment: new Set(["GuestHouse", "Invoice", "Booking", "User"]),
  MenuItem: new Set(["GuestHouse"]),
  RestaurantOrder: new Set(["GuestHouse", "User"]),
  OrderItem: new Set(["RestaurantOrder", "MenuItem"]),
  Expense: new Set(["GuestHouse", "User"]),
  CleaningTask: new Set(["GuestHouse", "Room", "User"]),
  CleaningTaskItem: new Set(["CleaningTask"]),
  Notification: new Set(["GuestHouse", "User"]),
  AuditLog: new Set(["GuestHouse", "User"]),
}

/**
 * Topological sort of tables based on dependencies.
 * Returns tables in insert-safe order (dependencies first).
 */
export function topologicalSort(tables: string[]): string[] {
  // Build adjacency: edges go from dependency → dependent
  const inDegree: Record<string, number> = {}
  const graph: Record<string, Set<string>> = {}

  for (const table of tables) {
    inDegree[table] = 0
    graph[table] = new Set()
  }

  for (const table of tables) {
    const deps = DEPENDENCIES[table]
    if (deps) {
      for (const dep of deps) {
        if (tables.includes(dep)) {
          graph[dep].add(table) // dep → table (table depends on dep)
          inDegree[table] = (inDegree[table] || 0) + 1
        }
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = []
  for (const table of tables) {
    if ((inDegree[table] || 0) === 0) {
      queue.push(table)
    }
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const node = queue.shift()!
    sorted.push(node)

    for (const neighbor of graph[node]) {
      inDegree[neighbor]--
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor)
      }
    }
  }

  // If not all nodes were sorted, there's a cycle — fall back to original order
  if (sorted.length !== tables.length) {
    console.warn("[backup-models] Cycle detected in dependencies, using original order")
    return tables
  }

  return sorted
}

/**
 * Reverse order for deletion (dependencies deleted last).
 */
export function getDeleteOrder(tables: string[]): string[] {
  return [...topologicalSort(tables)].reverse()
}

/**
 * Get the complete backup-able model configuration.
 * Call this once to get all info needed for backup/restore.
 */
export function getBackupConfig(db: any) {
  const modelNames = getBackupModelNames(db)
  const insertOrder = topologicalSort(modelNames)
  const deleteOrder = getDeleteOrder(modelNames)

  return {
    allModels: modelNames,
    insertOrder,
    deleteOrder,
    modelToDb: Object.fromEntries(
      modelNames.map(name => [name, toModelName(name)])
    ),
    dbToModel: Object.fromEntries(
      modelNames.map(name => [toModelName(name), name])
    ),
  }
}
