import type { TrackedTransaction } from '../types/transaction'

const reservedIds = new Set<string>()
let collisionSequence = 0

export function createTransactionId(transactions: readonly Pick<TrackedTransaction, 'id'>[]): string {
  const usedIds = new Set(transactions.map((transaction) => transaction.id))
  for (const id of reservedIds) {
    usedIds.add(id)
  }

  const baseId = `tx-rg-${Math.floor(1000 + Math.random() * 9000)}`
  let id = baseId

  if (usedIds.has(id)) {
    do {
      collisionSequence += 1
      id = `${baseId}-${collisionSequence}`
    } while (usedIds.has(id))
  }

  reservedIds.add(id)
  return id
}