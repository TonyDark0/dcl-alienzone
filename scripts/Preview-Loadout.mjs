// Development-only HTML layout approximation of the actual React-ECS component tree.
// This is not a native Explorer screenshot or mobile certification. No external URLs are loaded.
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'esbuild'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.ALIENZONE_PLAYWRIGHT_PATH || 'playwright')
const tutorialPreview = process.env.ALIENZONE_PREVIEW_TUTORIAL === '1'
const output = resolve(tutorialPreview ? 'tmp/tutorial-v001-review' : 'tmp/ui-v002-review')
mkdirSync(output, { recursive: true })
const bundled = await build({
  entryPoints: [tutorialPreview ? 'src/ui/screens/LobbyScreen.tsx' : 'src/ui/components/MatchLoadoutEditor.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  plugins: [
    {
      name: 'sdk-preview',
      setup(b) {
        b.onResolve({ filter: /^@dcl\/sdk\/(react-ecs|math|ecs|platform)$/ }, (a) => ({
          path: a.path,
          namespace: 'preview'
        }))
        b.onResolve({ filter: /gameClient$/ }, () => ({ path: 'client', namespace: 'preview' }))
        b.onResolve({ filter: /state\/uiState$/ }, () => ({ path: 'state', namespace: 'preview' }))
        b.onResolve({ filter: /audioDirector$/ }, () => ({ path: 'audio', namespace: 'preview' }))
        b.onLoad({ filter: /.*/, namespace: 'preview' }, (a) => ({
          contents:
            a.path === 'client'
              ? 'export function requestLeaderboard(){};export function requestReady(){}'
              : a.path === 'state'
                ? 'export const getUiState=()=>({phase:"LOBBY"})'
                : a.path.endsWith('/ecs')
                  ? 'export const engine={RootEntity:0};export const UiCanvasInformation={getOrNull:()=>globalThis.__previewCanvas}'
                  : a.path.endsWith('/platform')
                    ? 'export const isMobile=()=>globalThis.__previewMobile'
                    : a.path === 'audio'
                      ? 'export function playUiSound(){}'
                      : a.path.endsWith('/math')
                        ? 'export const Color4={create:(r,g,b,a)=>({r,g,b,a})}'
                        : `const createElement=(type,props,...children)=>{
          const p={...props,children:children.flat(Infinity).filter(Boolean)};
          const node=typeof type==='function'?type(p):{type,props:p,children:p.children};
          if(node&&p.interactionId)node.controlId=p.interactionId;
          if(node&&p.id)node.widget=p;
          return node;
        };export default {createElement};export const UiEntity='UiEntity',Label='Label';`
        }))
      }
    }
  ]
})
function editor() {
  const module = { exports: {} }
  new Function('module', 'exports', 'require', bundled.outputFiles[0].text)(module, module.exports, require)
  return tutorialPreview ? module.exports.Instructions : module.exports.MatchLoadoutEditor
}
const flat = (n) => (!n ? [] : [n, ...(n.children || []).flatMap(flat)])
const escape = (v) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const rgba = (c) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${c.a ?? 1})`
const px = (n) => (typeof n === 'number' ? `${n}px` : n)
const imageCache = new Map()
function texture(file, c = { r: 1, g: 1, b: 1, a: 1 }) {
  const key = JSON.stringify([file, c])
  if (imageCache.has(key)) return imageCache.get(key)
  const data = readFileSync(file),
    w = data.readUInt32BE(16),
    h = data.readUInt32BE(20)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><filter id="t" color-interpolation-filters="sRGB"><feColorMatrix values="${c.r} 0 0 0 0 0 ${c.g} 0 0 0 0 0 ${c.b} 0 0 0 0 0 ${c.a ?? 1} 0"/></filter><image width="${w}" height="${h}" href="data:image/png;base64,${data.toString('base64')}" filter="url(#t)"/></svg>`
  const value = { url: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'), w, h }
  imageCache.set(key, value)
  return value
}
function html(n) {
  if (!n || n.props?.uiTransform?.display === 'none') return ''
  const p = n.props || {},
    t = p.uiTransform || {},
    s = {
      display: 'flex',
      position: 'relative',
      boxSizing: 'border-box',
      flexDirection: t.flexDirection || 'row',
      flexShrink: 1,
      minWidth: 0
    }
  for (const key of [
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'flexGrow',
    'flexShrink',
    'flexWrap',
    'alignItems',
    'alignSelf',
    'justifyContent',
    'overflow',
    'opacity',
    'zIndex'
  ])
    if (t[key] !== undefined)
      s[key] = ['flexGrow', 'flexShrink', 'opacity', 'zIndex'].includes(key) ? t[key] : px(t[key])
  if (t.positionType === 'absolute') s.position = 'absolute'
  for (const [key, value] of Object.entries(t.position || {})) s[key] = px(value)
  for (const key of ['padding', 'margin'])
    if (t[key] !== undefined) {
      if (typeof t[key] === 'object')
        for (const [side, value] of Object.entries(t[key])) s[key + side[0].toUpperCase() + side.slice(1)] = px(value)
      else s[key] = px(t[key])
    }
  if (p.uiBackground?.texture) {
    const image = texture(p.uiBackground.texture.src, p.uiBackground.color)
    if (p.uiBackground.textureMode === 'nine-slices') {
      const a = p.uiBackground.textureSlices
      s.border = '12px solid transparent'
      s.borderImageSource = `url('${image.url}')`
      s.borderImageSlice = `${a.top * image.h} ${a.right * image.w} ${a.bottom * image.h} ${a.left * image.w} fill`
      s.borderImageRepeat = 'stretch'
    } else {
      s.backgroundImage = `url('${image.url}')`
      s.backgroundSize = '100% 100%'
    }
  } else if (p.uiBackground?.color) s.backgroundColor = rgba(p.uiBackground.color)
  if (n.type === 'Label') {
    s.fontSize = px(p.fontSize || 16)
    s.color = rgba(p.color || { r: 1, g: 1, b: 1, a: 1 })
    s.alignItems = String(p.textAlign || 'middle-center').startsWith('top') ? 'flex-start' : 'center'
    s.justifyContent = String(p.textAlign || 'middle-center').endsWith('left')
      ? 'flex-start'
      : String(p.textAlign || '').endsWith('right')
        ? 'flex-end'
        : 'center'
    s.textAlign = String(p.textAlign || 'middle-center').split('-')[1] || 'center'
    s.lineHeight = '1.15'
  }
  const css = Object.entries(s)
    .map(([k, v]) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + ':' + v)
    .join(';')
  return `<div data-control="${escape(n.controlId || '')}" style="${escape(css)}">${n.type === 'Label' ? `<span>${escape(p.value || '')}</span>` : (n.children || []).map(html).join('')}</div>`
}
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.ALIENZONE_BROWSER_PATH || undefined
})
try {
  const specs = tutorialPreview
    ? [
        { name: 'desktop-move-throw', width: 1920, height: 1080, mobile: false, compact: false, tutorialPage: 0 },
        { name: 'desktop-cards-coins', width: 1920, height: 1080, mobile: false, compact: false, tutorialPage: 1 },
        { name: 'desktop-contain', width: 1920, height: 1080, mobile: false, compact: false, tutorialPage: 2 },
        { name: 'mobile-landscape', width: 1600, height: 720, mobile: true, compact: true, tutorialPage: 0 },
        { name: 'mobile-portrait-move', width: 400, height: 900, mobile: true, compact: true, tutorialPage: 0 },
        { name: 'mobile-portrait-contain', width: 400, height: 900, mobile: true, compact: true, tutorialPage: 2 }
      ]
    : [
        { name: 'desktop', width: 1920, height: 1080, mobile: false, compact: false, preview: 'SHADOW' },
        { name: 'mobile-landscape', width: 1600, height: 720, mobile: true, compact: true, preview: 'VACUNE' },
        { name: 'portrait-rounds', width: 800, height: 1000, mobile: false, compact: true },
        { name: 'mobile-portrait-detail', width: 400, height: 900, mobile: true, compact: true, preview: 'VACUNE' }
      ]
  for (const spec of specs) {
    globalThis.__previewCanvas = spec
    globalThis.__previewMobile = spec.mobile
    const draw = editor()
    const render = () => draw({ compact: spec.compact, viewport: spec, onBack() {}, onConfirm() {} })
    const press = (id) => {
      const node = flat(render()).find((n) => n.controlId === id)
      const click = flat(node).find((n) => n.props?.onMouseDown)?.props.onMouseDown
      if (!click) throw Error('Missing interactive control ' + id)
      click()
    }
    if (tutorialPreview) {
      flat(render())
        .find((n) => n.widget?.id === 'instructions-pages')
        .widget.onPage(spec.tutorialPage)
    } else if (spec.preview) {
      if (spec.width / spec.height < 1.25) press('loadout-slot:0:0')
      press('loadout-tier:EPIC')
      if (spec.preview === 'VACUNE')
        flat(render())
          .find((n) => n.widget?.id === 'loadout-catalog')
          .widget.onPage(1)
      press('loadout-preview:' + spec.preview)
    }
    const scale = Math.min(spec.width / (spec.mobile ? 1600 : 1920), spec.height / (spec.mobile ? 720 : 1080))
    const page = await browser.newPage({ viewport: { width: spec.width, height: spec.height } })
    const document = `<!doctype html><meta charset="utf-8"><title>Alienzone v002 — component layout approximation</title><style>*{box-sizing:border-box}body{margin:0;background:#030914;font-family:Arial,sans-serif}main{display:flex;justify-content:center;align-items:center;position:absolute;transform-origin:0 0}</style><main style="width:${spec.width / scale}px;height:${spec.height / scale}px;transform:scale(${scale})">${html(render())}</main>`
    writeFileSync(resolve(output, spec.name + '.html'), document)
    await page.setContent(document)
    await page.screenshot({ path: resolve(output, spec.name + '.png') })
    const issues = await page
      .locator(tutorialPreview ? '[data-control="instructions-back"]' : '[data-control="loadout-confirm"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y, right: r.right, bottom: r.bottom }))
      )
    console.log(spec.name, JSON.stringify(issues))
    await page.close()
  }
} finally {
  await browser.close()
}
console.log('Review images saved in ' + output + ' (HTML approximation, not native DCL).')
