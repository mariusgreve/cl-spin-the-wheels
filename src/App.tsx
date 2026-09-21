import { useMemo } from 'react'
import levelData from './assets/levels/level-1.json'
import { loadLevel } from './engine/levelLoader'
import './styles.css'

const bundledAssets = import.meta.glob('./assets/**/*', { eager: true, query: '?url', import: 'default' })

function assetExists(assetPath: string): boolean {
  const relativePath = `./${assetPath.replace(/^\//, '')}`
  return Object.keys(bundledAssets).some((path) => path === relativePath)
}

export function App() {
  const result = useMemo(() => loadLevel(levelData, { assetExists }), [])

  if (!result.level) {
    return (
      <main className="shell error-state">
        <p className="eyebrow">Spin The Wheels</p>
        <h1>Level unavailable</h1>
        <p>The bundled level could not be loaded, so play cannot start.</p>
        <ul aria-label="Level validation errors">
          {result.errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      </main>
    )
  }

  return (
    <main className="shell">
      <header className="masthead">
        <p className="eyebrow">Spin The Wheels</p>
        <h1>Make a word</h1>
        <span className="level-tag">{result.level.level_id}</span>
      </header>
      <section className="picture-area" aria-label="Picture area">
        <img src={bundledAssets['./assets/images/sample-word.svg'] as string} alt="Sample reward" />
      </section>
      <section className="spinner-row" aria-label="Letter wheels">
        {result.level.spinners.map((spinner) => (
          <div className="spinner-slot" key={spinner.id}>
            <span>{spinner.letter_list[0]}</span>
          </div>
        ))}
      </section>
      <button className="spin-button" type="button" disabled>Spin</button>
      <p className="status" role="status">Level loaded and ready for the first game milestone.</p>
    </main>
  )
}