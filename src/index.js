import React, { useCallback, useEffect, useState } from 'react'
// import { v4 as uuidv4 } from 'uuid'

import {
  centerToTL,
  tLToCenter,
  getNewStyle,
  degToRadian,
  isOutOfBoundary
} from './utils'
import Rect from './Rect'

export default function ResizableRect({
  rotatable = true,
  parentRotateAngle = 0,
  zoomable = '',
  minWidth = 10,
  minHeight = 10,
  aspectRatio,
  onRotateStart,
  onRotate,
  onRotateEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onDragStart,
  onDrag,
  onDragEnd,
  children,
  color = 'black',
  haveBoundary = true,
  defaultRotateAngle = 0,
  defaultFocus = false,
  focusChange = true,
  id = 'default_id',
  onFocusChange,

  initValues,
  height: propHeight,
  width: propWidth,
  top: propTop,
  left: propLeft,
  isDraggable = true, //
  scale = 1
}) {
  const [top, _setTop] = useState(initValues?.top ?? 10)
  const [left, _setLeft] = useState(initValues?.left ?? 10)
  const [isFocused, _setIsFocused] = useState(focusChange)

  const topRef = React.useRef(top)
  const setTop = (data) => {
    topRef.current = data
    _setTop(data)
  }

  const leftRef = React.useRef(left)
  const setLeft = (data) => {
    leftRef.current = data
    _setLeft(data)
  }

  const isFocusedRef = React.useRef(isFocused)
  const setIsFocused = (data) => {
    isFocusedRef.current = data
    _setIsFocused(data)
  }

  const [width, setWidth] = useState(initValues?.width ?? 100)
  const [height, setHeight] = useState(initValues?.height ?? 100)
  const [rotateAngle, setRotateAngle] = useState(defaultRotateAngle)
  // const [itemId, setItemId] = useState(uuidv4())
  const [itemId, setItemId] = useState(id)

  const styles = tLToCenter({ top, left, width, height, rotateAngle })

  useEffect(() => {
    if (propHeight) {
      setHeight(propHeight)
    }
  }, [propHeight])

  useEffect(() => {
    if (propWidth) {
      setWidth(propWidth)
    }
  }, [propWidth])

  useEffect(() => {
    if (propTop || propTop === 0) {
      setTop(propTop)
    }
  }, [propTop])

  useEffect(() => {
    if (propLeft || propLeft === 0) {
      setLeft(propLeft)
    }
  }, [propLeft])

  useEffect(() => {
    const keyPressCallback = (event) => {
      if (isFocusedRef.current && event.altKey) {
        if (event.keyCode == '38') {
          // up arrow
          handleDrag(0, -1, true)
        } else if (event.keyCode == '40') {
          // down arrow
          handleDrag(0, 1, true)
        } else if (event.keyCode == '37') {
          // left arrow
          handleDrag(-1, 0, true)
        } else if (event.keyCode == '39') {
          // right arrow
          handleDrag(1, 0, true)
        }
      }
    }

    document.addEventListener('keydown', keyPressCallback, false)

    return () => {
      document.removeEventListener('keydown', keyPressCallback, false)
    }
  }, [left, top])

  const handleRotate = (angle, startAngle) => {
    if (!onRotate) return
    let rotateAngle = Math.round(startAngle + angle)
    if (rotateAngle >= 360) {
      rotateAngle -= 360
    } else if (rotateAngle < 0) {
      rotateAngle += 360
    }
    if (rotateAngle > 356 || rotateAngle < 4) {
      rotateAngle = 0
    } else if (rotateAngle > 86 && rotateAngle < 94) {
      rotateAngle = 90
    } else if (rotateAngle > 176 && rotateAngle < 184) {
      rotateAngle = 180
    } else if (rotateAngle > 266 && rotateAngle < 274) {
      rotateAngle = 270
    }

    setRotateAngle(rotateAngle)
    onRotate(rotateAngle)
  }

  const handleResize = (length, alpha, rect, type, isShiftKey) => {
    if (!onResize) return

    const beta = alpha - degToRadian(rotateAngle + parentRotateAngle)
    const deltaW = (length * Math.cos(beta)) / scale
    const deltaH = (length * Math.sin(beta)) / scale
    const ratio =
      isShiftKey && !aspectRatio ? rect.width / rect.height : aspectRatio
    const {
      position: { centerX, centerY },
      size: { width, height }
    } = getNewStyle(
      type,
      { ...rect, rotateAngle },
      deltaW,
      deltaH,
      ratio,
      minWidth,
      minHeight
    )

    const values = centerToTL({ centerX, centerY, width, height, rotateAngle })

    if (
      isOutOfBoundary(
        values.left,
        values.top,
        width,
        height,
        haveBoundary,
        itemId
      )
    ) {
      return
    }

    setHeight(height)
    setWidth(width)

    onResize(values, isShiftKey, type)
  }

  const handleDrag = (deltaX, deltaY, isShiftKey, noDebounce = false) => {
    if (!isDraggable) return

    if (isShiftKey) {
      const absDeltaY = Math.abs(deltaY)
      const absDeltaX = Math.abs(deltaX)

      if (absDeltaY < 2 && absDeltaX < 2) {
        // Ignores smaller changes for more precision
        return
      }

      if (absDeltaX > absDeltaY) {
        deltaY = 0
      } else {
        deltaX = 0
      }
    }

    const newLeft = Math.round(leftRef.current + deltaX / scale)
    const newTop = Math.round(topRef.current + deltaY / scale)

    if (isOutOfBoundary(newLeft, newTop, width, height, haveBoundary, itemId)) {
      return
    }

    setLeft(newLeft)
    setTop(newTop)
    onDrag && onDrag(newLeft, newTop, noDebounce)
  }

  return (
    <Rect
      styles={styles}
      zoomable={zoomable}
      rotatable={Boolean(rotatable && onRotate)}
      parentRotateAngle={parentRotateAngle}
      onResizeStart={onResizeStart}
      onResize={handleResize}
      onResizeEnd={onResizeEnd}
      onRotateStart={onRotateStart}
      onRotate={handleRotate}
      onRotateEnd={onRotateEnd}
      onDragStart={onDragStart}
      onDrag={handleDrag}
      isDraggable={isDraggable}
      onDragEnd={onDragEnd}
      children={children}
      color={color}
      itemId={itemId}
      defaultFocus={defaultFocus}
      focusChange={focusChange}
      onFocusChange={(isFocused) => {
        setIsFocused(isFocused)
        onFocusChange && onFocusChange(isFocused)
      }}
    />
  )
}
