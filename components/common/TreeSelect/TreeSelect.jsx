"use client"

import { cn } from '@/app/lib/utils'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './TreeSelect.module.scss'

function TreeNode({ node, level = 0, selectedValue, onSelect, expandedNodes, toggleNode, alwaysExpanded = false, showTypeBadge = false }) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.value)
  const isSelected = selectedValue === node.value

  // Get type badge info - only show if showTypeBadge is true
  const getTypeBadge = () => {
    if (!showTypeBadge) return null
    if (!node.tip || !Array.isArray(node.tip) || node.tip.length === 0) return null

    const tipText = node.tip[0]
    if (!tipText) return null

    if (tipText.includes('Актив')) {
      return { text: 'Актив', className: styles.badgeAsset }
    } else if (tipText.includes('Капитал')) {
      return { text: 'Капитал', className: styles.badgeCapital }
    } else if (tipText.includes('Обязательства')) {
      return { text: 'Обязательства', className: styles.badgeLiability }
    } else if (tipText.includes('Доход')) {
      return { text: 'Доходы', className: styles.badgeIncome }
    } else if (tipText.includes('Расход')) {
      return { text: 'Расходы', className: styles.badgeExpense }
    }
    return null
  }

  const typeBadge = getTypeBadge()

  return (
    <div>
      <div
        className={cn(
          styles.treeNode,
          isSelected && styles.selected,
          !node.selectable && !hasChildren && styles.disabled
        )}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {hasChildren ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (!alwaysExpanded) {
                  toggleNode(node.value)
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={styles.treeNodeIconButton}
              disabled={alwaysExpanded}
              style={{ cursor: alwaysExpanded ? 'default' : 'pointer' }}
            >
              <svg
                className={cn(styles.treeNodeIcon, isExpanded && styles.expanded)}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ opacity: alwaysExpanded ? 0.5 : 1 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (node.selectable) {
                  onSelect(node)
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={styles.treeNodeTextButton}
              disabled={!node.selectable}
            >
              <span className={styles.treeNodeText}>{node.title}</span>
              {typeBadge && (
                <span className={cn(styles.typeBadge, typeBadge.className)}>
                  {typeBadge.text}
                </span>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (node.selectable) {
                onSelect(node)
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={styles.treeNodeTextButton}
            disabled={!node.selectable}
          >
            <span className={styles.treeNodeSpacer} />
            <span className={styles.treeNodeText}>{node.title}</span>
            {typeBadge && (
              <span className={cn(styles.typeBadge, typeBadge.className)}>
                {typeBadge.text}
              </span>
            )}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className={styles.treeNodeChildren}>
          {node.children.map((child) => (
            <TreeNode
              key={child.value}
              node={child}
              level={level + 1}
              selectedValue={selectedValue}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              alwaysExpanded={alwaysExpanded}
              showTypeBadge={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeSelect({
  data = [],
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  loading = false,
  allowRoot = false,
  alwaysExpanded = false, // New prop to control if groups can be collapsed
  hasError = false,
  // Pagination props
  onLoadMore = null,
  hasMore = false,
  isLoadingMore = false,
  onSearch = null,
  searchDebounceMs = 500,
  dropdownClassName = "",
  usePortal = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [isRoot, setIsRoot] = useState(!value)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 'auto', bottom: 'auto', left: 0, width: 0 })
  const [isPositioned, setIsPositioned] = useState(false)
  const t = useTranslations('Common')
  const [openUpwards, setOpenUpwards] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const listRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      const target = event.target
      if (!target) return

      // Check if click is on the button that opens the dropdown
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return
      }

      // Check if click is inside the dropdown
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return
      }

      // Don't close if there's search text (user might want to clear it)
      if (search) {
        return
      }

      // Check if click is on modal overlay - don't close if it is
      if (target instanceof HTMLElement) {
        const isModalOverlay = target.classList.contains('overlay') ||
          target.closest('.modal') !== null ||
          target.closest('[class*="overlay"]') !== null

        if (!isModalOverlay) {
          setIsOpen(false)
        }
      } else {
        setIsOpen(false)
      }
    }

    // Use setTimeout to avoid immediate closure when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    // Update portal position
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const spaceBelow = windowHeight - rect.bottom
      const spaceAbove = rect.top

      const shouldOpenUpwards = spaceBelow < 350 && spaceAbove > spaceBelow
      setOpenUpwards(shouldOpenUpwards)

      if (usePortal) {
        if (shouldOpenUpwards) {
          setDropdownPosition({
            bottom: windowHeight - rect.top + 4,
            top: 'auto',
            left: rect.left,
            width: rect.width
          })
        } else {
          setDropdownPosition({
            top: rect.bottom + 4,
            bottom: 'auto',
            left: rect.left,
            width: rect.width
          })
        }
        requestAnimationFrame(() => {
          setIsPositioned(true)
        })
      }
    } else if (!isOpen) {
      setIsPositioned(false)
    }

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, search, usePortal])

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (onSearch && search) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(search)
        setIsSearching(false)
      }, searchDebounceMs)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search, onSearch, searchDebounceMs])

  // Handle scroll for infinite loading
  useEffect(() => {
    const listElement = listRef.current
    if (!listElement || !onLoadMore || !hasMore || isLoadingMore) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement
      // Load more when scrolled to 80% of the list
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        onLoadMore()
      }
    }

    listElement.addEventListener('scroll', handleScroll)
    return () => listElement.removeEventListener('scroll', handleScroll)
  }, [onLoadMore, hasMore, isLoadingMore])

  // Find selected item in tree
  const findNodeByValue = (nodes, targetValue) => {
    for (const node of nodes) {
      if (node.value === targetValue) return node
      if (node.children) {
        const found = findNodeByValue(node.children, targetValue)
        if (found) return found
      }
    }
    return null
  }

  // Filter tree by search
  const filterTree = (nodes, searchTerm) => {
    if (!searchTerm) return nodes

    return nodes.reduce((acc, node) => {
      const matchesSearch = node.title?.toLowerCase().includes(searchTerm.toLowerCase())
      const filteredChildren = node.children ? filterTree(node.children, searchTerm) : []

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren
        })
      }

      return acc
    }, [])
  }

  const selectedNode = findNodeByValue(data, value)
  const selectedLabel = isRoot && allowRoot
    ? t('rootElement')
    : selectedNode
      ? selectedNode.title
      : (placeholder || t('placeholders.select'))
  const filteredData = onSearch ? data : filterTree(data, search)

  // Auto-expand nodes marked as expanded
  useEffect(() => {
    if (filteredData.length === 0) return

    if (alwaysExpanded) {
      // When alwaysExpanded is true, expand all nodes with children
      const expandAll = (nodes) => {
        const expanded = new Set()
        const traverse = (items) => {
          items.forEach(item => {
            if (item.children && item.children.length > 0) {
              expanded.add(item.value)
              traverse(item.children)
            }
          })
        }
        traverse(nodes)
        return expanded
      }
      const newExpanded = expandAll(filteredData)

      // Only update if different
      const currentKeys = Array.from(expandedNodes).sort().join(',')
      const newKeys = Array.from(newExpanded).sort().join(',')
      if (currentKeys !== newKeys) {
        setExpandedNodes(newExpanded)
      }
    } else {
      // Only expand nodes marked with expanded: true
      const expandMarkedNodes = (nodes) => {
        const expanded = new Set()
        const traverse = (items) => {
          items.forEach(item => {
            if (item.expanded || (item.children && item.children.length > 0)) {
              expanded.add(item.value)
              if (item.children) {
                traverse(item.children)
              }
            }
          })
        }
        traverse(nodes)
        return expanded
      }
      const newExpanded = expandMarkedNodes(filteredData)

      // Only update if different
      const currentKeys = Array.from(expandedNodes).sort().join(',')
      const newKeys = Array.from(newExpanded).sort().join(',')
      if (currentKeys !== newKeys) {
        setExpandedNodes(newExpanded)
      }
    }
  }, [data, alwaysExpanded]) // Use data instead of filteredData to avoid infinite loop

  // Auto-expand nodes when searching
  useEffect(() => {
    if (search && filteredData.length > 0) {
      const expandAll = (nodes) => {
        const expanded = new Set()
        const traverse = (items) => {
          items.forEach(item => {
            if (item.children && item.children.length > 0) {
              expanded.add(item.value)
              traverse(item.children)
            }
          })
        }
        traverse(nodes)
        return expanded
      }
      const newExpanded = expandAll(filteredData)

      // Only update if different
      const currentKeys = Array.from(expandedNodes).sort().join(',')
      const newKeys = Array.from(newExpanded).sort().join(',')
      if (currentKeys !== newKeys) {
        setExpandedNodes(newExpanded)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleNode = (nodeValue) => {
    if (alwaysExpanded) {
      // Don't allow toggling when alwaysExpanded is true
      return
    }
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeValue)) {
        newSet.delete(nodeValue)
      } else {
        newSet.add(nodeValue)
      }
      return newSet
    })
  }

  const handleSelect = (node) => {
    if (node.selectable) {
      setIsRoot(false)
      onChange(node.value, node)
      setIsOpen(false)
      setSearch('')
    }
  }

  const handleRootToggle = (e) => {
    e.stopPropagation()
    const newIsRoot = e.target.checked
    setIsRoot(newIsRoot)
    if (newIsRoot) {
      onChange(null, null)
    }
  }

  // Update isRoot when value changes externally
  useEffect(() => {
    setIsRoot(!value)
  }, [value])

  return (
    <div className={cn(styles.container, className)} ref={!usePortal ? dropdownRef : null}>
      <button
        ref={buttonRef}
        id='tree-select-button'
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (!disabled) {
            setIsOpen(!isOpen)
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        disabled={disabled || loading}
        className={cn(
          styles.button,
          disabled || loading ? styles.disabled : styles.enabled,
          !value && styles.empty,
          hasError && styles.error, className
        )}
      >
        <div className={styles.buttonContent}>
          <span className={styles.buttonText}>{loading ? t('loading') : selectedLabel}</span>
          <svg
            className={cn(styles.buttonIcon, isOpen && styles.open)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (() => {
        const dropdownContent = (
        <div
            ref={usePortal ? dropdownRef : null}
          className={cn(styles.dropdown, dropdownClassName)}
            style={usePortal ? {
              position: 'fixed',
            top: dropdownPosition.top !== 'auto' ? `${dropdownPosition.top}px` : 'auto',
            bottom: dropdownPosition.bottom !== 'auto' ? `${dropdownPosition.bottom}px` : 'auto',
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            opacity: isPositioned ? 1 : 0,
            visibility: isPositioned ? 'visible' : 'hidden',
            zIndex: 9999
          } : {
            bottom: openUpwards ? '100%' : 'auto',
            top: openUpwards ? 'auto' : '100%',
            marginBottom: openUpwards ? '0.25rem' : '0',
            marginTop: openUpwards ? '0' : '0.25rem'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search')}
              className={styles.searchInput}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSearch('')
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={styles.searchClearButton}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Root checkbox option */}
          {allowRoot && (
            <div className={styles.rootOption}>
              <label className={styles.rootCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={isRoot}
                  onChange={handleRootToggle}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={styles.rootCheckbox}
                />
                  <span className={styles.rootCheckboxText}>{t('createAsRoot')}</span>
              </label>
            </div>
          )}

          {/* Tree list */}
          <div className={styles.treeList} ref={listRef}>
            {filteredData.length === 0 ? (
              <div className={styles.emptyState}>
                  {isSearching ? t('searching') : t('empty')}
              </div>
            ) : (
              <>
                {filteredData.map((node) => (
                  <TreeNode
                    key={node.value}
                    node={node}
                    level={0}
                    selectedValue={value}
                    onSelect={handleSelect}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                    alwaysExpanded={alwaysExpanded}
                    showTypeBadge={true}
                  />
                ))}

                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className={styles.loadingMore}>
                    <div className={styles.loadingSpinner}></div>
                        <span>{t('loading')}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        )

        return usePortal && typeof window !== 'undefined'
          ? createPortal(dropdownContent, document.body)
          : dropdownContent
      })()}
    </div>
  )
}
