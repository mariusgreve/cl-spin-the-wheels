import { expect, test, type Page } from '@playwright/test'

const levelOneWords = [
  'bun',
  'car',
  'cat',
  'hat',
  'hut',
  'map',
  'mop',
  'pen',
  'pet',
  'pin',
  'pit',
  'pot',
  'sun',
]

async function readLetters(page: Page, spinnerIds: string[]) {
  return Promise.all(
    spinnerIds.map(async (spinnerId) => {
      const label = await page.locator(`[aria-label^="${spinnerId} letter wheel showing "]`).getAttribute('aria-label')
      const match = label?.match(/showing ([a-z])$/)
      if (!match) {
        throw new Error(`Unable to read a letter for ${spinnerId}`)
      }
      return match[1]
    }),
  )
}

test('E2E-1 resolves a valid word and reward media after a random spin', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Spin', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Spinning...', exact: true })).toBeDisabled()
  await expect(page.locator('img[alt$=" reward"]').first()).toBeVisible({ timeout: 20_000 })

  const word = (await readLetters(page, ['spinner1', 'spinner2', 'spinner3'])).join('')
  expect(levelOneWords).toContain(word)
})

test('E2E-2 shows no-match feedback after a deterministic non-word settlement', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Next letter for spinner1' }).click()
  await page.getByRole('button', { name: 'Next letter for spinner2' }).click()

  await expect(page.getByRole('img', { name: 'confused reward' })).toBeVisible({ timeout: 20_000 })
  const word = (await readLetters(page, ['spinner1', 'spinner2', 'spinner3'])).join('')
  expect(word).toBe('ced')
})

test('E2E-3 progresses to the next level after the distinct-word threshold is met', async ({ page }) => {
  const settleWord = async (word: string) => {
    for (const [index, letter] of word.split('').entries()) {
      const spinnerName = `spinner${index + 1}`
      const target = `${spinnerName} letter wheel showing ${letter}`
      const button = page.getByRole('button', { name: `Next letter for ${spinnerName}` })

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const current = await page.locator(`[aria-label^="${spinnerName} letter wheel showing "]`).getAttribute('aria-label')
        if (current === target) {
          break
        }

        if (await button.isDisabled()) {
          await page.waitForTimeout(250)
          continue
        }

        await button.click()
        await page.waitForTimeout(350)
      }
    }

    await expect(page.locator('img[alt$=" reward"]').first()).toBeVisible({ timeout: 20_000 })
  }

  await page.goto('/')

  await settleWord('bun')
  await settleWord('cat')
  await settleWord('hat')
  await settleWord('map')
  await settleWord('pen')
  await settleWord('pit')
  await settleWord('sun')

  await expect(page.getByRole('button', { name: 'Go to next level', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Go to next level', exact: true }).click()
  await expect(page.getByText('level 2')).toBeVisible()
})

test('E2E-4 simulates two pointer flicks and verifies the wheel settles on valid letters', async ({ page }) => {
  const firstSelector = '.spinner-slot'
  const runFlick = async (startY: number, moveY: number, endY: number) => {
    const slot = page.locator(firstSelector).first()
    await slot.dispatchEvent('pointerdown', { pointerId: 1, clientY: startY, isPrimary: true })
    await slot.dispatchEvent('pointermove', { pointerId: 1, clientY: moveY, isPrimary: true })
    await slot.dispatchEvent('pointerup', { pointerId: 1, clientY: endY, isPrimary: true })
    await expect(slot).toHaveClass(/is-spinning/)
    await page.waitForFunction(() => !document.querySelector('.spinner-slot')?.classList.contains('is-spinning'))

    const label = await page.locator('[aria-label^="spinner1 letter wheel showing "]').getAttribute('aria-label')
    expect(label).toMatch(/^spinner1 letter wheel showing [a-z]$/)
  }

  await page.goto('/')
  await runFlick(120, 100, 80)

  await page.goto('/')
  await runFlick(120, 60, 0)
})

test('E2E-5 resolves the bundled five-spinner reward cycle on the great-tier fixture', async ({ page }) => {
  await page.goto('/?level=fixture-5spinner-great')

  await expect(page.getByText('fixture 5spinner great')).toBeVisible()
  await expect(page.locator('.spinner-slot')).toHaveCount(5)

  await page.getByRole('button', { name: 'Spin', exact: true }).click()
  await expect(page.locator('img[alt$=" reward"]').first()).toBeVisible({ timeout: 20_000 })

  const letters = await readLetters(page, ['spinner1', 'spinner2', 'spinner3', 'spinner4', 'spinner5'])
  expect(['crane', 'stone', 'plane', 'flair', 'strip']).toContain(letters.join(''))
})
