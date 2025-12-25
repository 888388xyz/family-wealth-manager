/**
 * Account utility functions for clone operations
 */

export interface AccountSource {
  bankName: string
  productType: string | null
  currency: string | null
  expectedYield: number | null
  notes: string | null
}

export interface CloneData {
  bankName: string
  productType: string | null
  currency: string | null
  expectedYield: number | null
  notes: string | null
  accountName: string
  balance: number
}

/**
 * Creates pre-fill data for cloning an account.
 * Copies: bankName, productType, currency, expectedYield, notes
 * Does NOT copy: accountName (empty string), balance (0)
 * 
 * @param account - The source account to clone from
 * @returns CloneData object with pre-filled values
 */
export function createCloneData(account: AccountSource): CloneData {
  return {
    bankName: account.bankName,
    productType: account.productType,
    currency: account.currency,
    expectedYield: account.expectedYield,
    notes: account.notes,
    accountName: "",
    balance: 0,
  }
}
