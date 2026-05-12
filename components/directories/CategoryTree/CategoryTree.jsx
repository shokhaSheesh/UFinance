"use client"

import { cn } from '@/lib/utils'
import { useState } from 'react'
import styles from './CategoryTree.module.scss'

export function CategoryTree({ data, onSelect }) {
  const [expanded, setExpanded] = useState([])

  const toggleExpand = (id) => {
    setExpanded(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expanded.includes(node.id)

    return (
      <div key={node.id}>
        <div 
          className={cn(
            styles.node,
            level > 0 && styles.nested
          )}
          onClick={() => {
            if (hasChildren) toggleExpand(node.id)
            onSelect?.(node)
          }}
        >
          {hasChildren && (
            <svg 
              className={cn(styles.nodeIcon, isExpanded && styles.expanded)} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          )}
          {!hasChildren && <div className={styles.nodeSpacer} />}
          <span className={styles.nodeName}>{node.name}</span>
          {node.count !== undefined && (
            <span className={styles.nodeCount}>({node.count})</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className={styles.children}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {data.map(node => renderNode(node))}
    </div>
  )
}
