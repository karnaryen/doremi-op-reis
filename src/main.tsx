import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { config as faConfig } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
// Latin subset only: enough for English and Dutch.
import '@fontsource/lato/latin-400.css'
import '@fontsource/lato/latin-700.css'
import '@fontsource/merriweather/latin-400.css'
import '@fontsource/merriweather/latin-700.css'
import { App } from '@/app/App'
import { useLocaleStore } from '@/features/locale-switcher/model/localeStore'
import { activateLocale } from '@/shared/i18n/i18n'

// FA styles are imported above; don't inject them again at runtime.
faConfig.autoAddCss = false

const root = document.getElementById('root')
if (!root) throw new Error('#root element not found')

// Load the initial catalog before first paint to avoid a flash of untranslated text.
void activateLocale(useLocaleStore.getState().locale).then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
