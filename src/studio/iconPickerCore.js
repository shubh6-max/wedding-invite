import { createElement as h, useState, useMemo } from 'react'
import { TIMELINE_ICONS, ICON_CATEGORIES, TimelineIcon } from '../templates/sageenvelope/timelineIcons.js'

const ALL_CATEGORIES = [
  { id: 'all', label: 'All' },
  ...ICON_CATEGORIES
]

/**
 * Category-filtered Icon Picker popup with instant search across all 40 timeline icons
 *
 * @param {object} props
 * @param {string} props.currentIcon - Currently selected icon key
 * @param {function} props.onSelect - Callback with selected icon key
 * @param {function} props.onClose - Dismiss callback
 * @param {string} [props.initialCategory] - Initial category filter
 * @param {string} [props.initialSearch] - Initial search query
 */
export function IconPicker({
  currentIcon = 'rings',
  onSelect,
  onClose,
  initialCategory = 'all',
  initialSearch = ''
}) {
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase()
    return Object.entries(TIMELINE_ICONS).filter(([key, icon]) => {
      if (category !== 'all' && icon.category !== category) return false
      if (!q) return true
      return key.toLowerCase().includes(q) || icon.label.toLowerCase().includes(q)
    })
  }, [search, category])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  return h(
    'div',
    {
      className: 'icon-picker-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Select Icon',
      onClick: handleBackdropClick
    },
    h(
      'div',
      {
        className: 'icon-picker-dialog',
        onClick: (e) => e.stopPropagation()
      },
      // Header
      h(
        'div',
        { className: 'icon-picker-header' },
        h('h3', { className: 'icon-picker-title' }, 'Choose Icon'),
        h(
          'button',
          {
            type: 'button',
            className: 'icon-picker-close',
            'aria-label': 'Close icon picker',
            onClick: () => onClose?.()
          },
          '✕'
        )
      ),
      // Search input
      h(
        'div',
        { className: 'icon-picker-search-wrap' },
        h('input', {
          type: 'search',
          className: 'icon-picker-search',
          placeholder: 'Search icons...',
          value: search,
          onChange: (e) => setSearch(e.target.value),
          'aria-label': 'Search icons'
        })
      ),
      // Category tabs
      h(
        'div',
        {
          className: 'icon-picker-tabs',
          role: 'tablist',
          'aria-label': 'Icon categories'
        },
        ALL_CATEGORIES.map((cat) =>
          h(
            'button',
            {
              key: cat.id,
              type: 'button',
              role: 'tab',
              className: `icon-picker-tab${category === cat.id ? ' icon-picker-tab--active' : ''}`,
              'aria-selected': category === cat.id,
              onClick: () => setCategory(cat.id)
            },
            cat.label
          )
        )
      ),
      // Grid of icons
      h(
        'div',
        { className: 'icon-picker-grid' },
        filteredIcons.length === 0
          ? h('p', { className: 'icon-picker-empty' }, `No icons found for "${search}"`)
          : filteredIcons.map(([key, icon]) => {
              const isSelected = key === currentIcon
              return h(
                'button',
                {
                  key,
                  type: 'button',
                  className: `icon-picker-item${isSelected ? ' icon-picker-item--selected' : ''}`,
                  'data-icon': key,
                  'aria-label': icon.label,
                  'aria-pressed': isSelected,
                  onClick: () => {
                    onSelect?.(key)
                    onClose?.()
                  }
                },
                h(TimelineIcon, { name: key, size: 28 }),
                h('span', { className: 'icon-picker-name' }, icon.label)
              )
            })
      )
    )
  )
}

export default IconPicker
