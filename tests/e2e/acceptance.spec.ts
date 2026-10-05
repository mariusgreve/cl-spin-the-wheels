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

test('UX-05 keeps the stage stable across help, progress and three-, four- and five-wheel levels', async ({ page }) => {
  const viewports = [[320, 568], [360, 640], [430, 932], [568, 320], [932, 430], [1280, 720]]
  const stageGeometry = () => page.evaluate(() =>
    ['.picture-area', '.spinner-row', '.spin-button'].map((selector) => {
      const bounds = document.querySelector(selector)!.getBoundingClientRect()
      return { y: bounds.y, height: bounds.height }
    }),
  )
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height })
    let referenceStage: Awaited<ReturnType<typeof stageGeometry>> | undefined
    for (const level of ['level-1', 'level-2', 'level-3']) {
      await page.goto(`/?level=${level}`)
      await page.evaluate(() => document.fonts.ready)
      const beforeHelp = await stageGeometry()
      referenceStage ??= beforeHelp
      expect(beforeHelp, `${level} at ${width}x${height}`).toEqual(referenceStage)
      const geometry = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        bottom: document.querySelector('.spin-button')?.getBoundingClientRect().bottom ?? Infinity,
        targets: Array.from(document.querySelectorAll('button')).map((button) => {
          const bounds = button.getBoundingClientRect()
          return { width: bounds.width, height: bounds.height, right: bounds.right, left: bounds.left }
        }),
      }))
      expect(geometry.width, `${level} at ${width}x${height}`).toBeLessThanOrEqual(width)
      expect(geometry.bottom, `${level} at ${width}x${height}`).toBeLessThanOrEqual(height)
      for (const target of geometry.targets) {
        expect(target.width).toBeGreaterThanOrEqual(44)
        expect(target.height).toBeGreaterThanOrEqual(44)
        expect(target.right).toBeLessThanOrEqual(width)
        expect(target.left).toBeGreaterThanOrEqual(0)
      }
      await page.getByRole('button', { name: 'Show visual help' }).click()
      await expect(page.getByRole('region', { name: 'Visual word-building example' })).toBeVisible()
      expect(await stageGeometry()).toEqual(beforeHelp)
      await expect(page.getByRole('button', { name: 'Replay word sound' })).toHaveCount(0)
      const primary = await page.getByRole('button', { name: 'Spin', exact: true }).boundingBox()
      expect((primary?.y ?? Infinity) + (primary?.height ?? Infinity)).toBeLessThanOrEqual(height)
      await page.getByRole('button', { name: 'Show visual help' }).click()
      await expect(page.getByRole('region', { name: 'Visual word-building example' })).toHaveCount(0)
      expect(await stageGeometry()).toEqual(beforeHelp)
    }
  }
})

test('UX-08 cancels unfinished play and resumes explicitly with keyboard controls', async ({ page }) => {
  await page.goto('/')
  const original = await readLetters(page, ['spinner1', 'spinner2', 'spinner3'])
  await page.getByRole('button', { name: 'Spin', exact: true }).click()
  await page.getByRole('button', { name: 'Pause game' }).click()
  await expect(page.getByRole('main')).toHaveAttribute('data-paused', 'true')
  expect(await readLetters(page, ['spinner1', 'spinner2', 'spinner3'])).toEqual(original)
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Resume game' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeEnabled()
})

test('UX-09 supports muted play and pronunciation replay under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const readyPicture = await page.locator('.picture-area').boundingBox()
  const readyWheels = await page.locator('.spinner-row').boundingBox()
  const readyAction = await page.locator('.spin-button').boundingBox()
  await page.getByRole('button', { name: 'Mute sound' }).click()
  await page.getByRole('button', { name: 'Spin', exact: true }).click()
  await expect(page.locator('.reward-caption')).toHaveClass(/is-visible/)
  expect(await page.locator('.picture-area').boundingBox()).toEqual(readyPicture)
  expect(await page.locator('.spinner-row').boundingBox()).toEqual(readyWheels)
  expect(await page.locator('.spin-button').boundingBox()).toEqual(readyAction)
  await expect(page.getByRole('button', { name: 'Replay word sound' })).toBeDisabled()
  await expect(page.locator('.confetti')).toHaveCount(0)
  await page.getByRole('button', { name: 'Unmute sound' }).click()
  await expect(page.getByRole('button', { name: 'Replay word sound' })).toBeEnabled()
  await page.getByRole('button', { name: 'Replay word sound' }).click()
  const audio = await page.locator('audio').evaluate((element: HTMLAudioElement) => ({ paused: element.paused, source: element.src }))
  expect(audio.source).toContain('/assets/audio/')
})

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
  await expect(page.getByRole('main')).toHaveAttribute('data-level-id', 'level-2')
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

test('E2E-5 resolves the bundled five-spinner reward cycle on level 3', async ({ page }) => {
  await page.goto('/?level=level-3')

  await expect(page.getByRole('main')).toHaveAttribute('data-level-id', 'level-3')
  await expect(page.locator('.spinner-slot')).toHaveCount(5)

  await page.getByRole('button', { name: 'Spin', exact: true }).click()
  await expect(page.locator('img[alt$=" reward"]').first()).toBeVisible({ timeout: 20_000 })

  const letters = await readLetters(page, ['spinner1', 'spinner2', 'spinner3', 'spinner4', 'spinner5'])
  expect(['crane', 'plane', 'stone', 'smile', 'slide', 'plant']).toContain(letters.join(''))
})
