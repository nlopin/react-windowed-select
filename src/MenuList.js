import {
  createGetHeight,
  flattenGroupedChildren,
  getCurrentIndex,
  sum,
  useShareForwardedRef,
} from './util';

import React, { forwardRef, useRef, useMemo, useEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';

const DropdownItem= forwardRef((
  {
    data,
    index,
    setSize,
    ...passThroughProps
  },
  ref,
) => {
  const resolvedRef = useShareForwardedRef(ref);

  useEffect(() => {
    if (resolvedRef.current) {
      console.count(`set size ${index}`)
      console.log('Should set Size: ', index, resolvedRef.current.getBoundingClientRect().height)
      // setSize({index, size: resolvedRef.current.getBoundingClientRect().height });
    }
  }, [resolvedRef.current]);

  // console.log(data);

  return (
    <div 
      key={`option-${index}`} 
      ref={resolvedRef} 
    >
      {data}
    </div>
  );
});

function MenuList (props) {

  // create local state for measured heights
  const [sizes, setSizes] = useState({});
  useEffect(() => {
    setSizes({});
  }, [props.children] );


  const children = useMemo(
    () => {
      const children = React.Children.toArray(props.children);

      const head = children[0] || {};
      const {
        props: {
          data: {
            options = []
          } = {},
        } = {},
      } = head;
      const groupedChildrenLength = options.length;
      const isGrouped = groupedChildrenLength > 0;
      const flattenedChildren = isGrouped && flattenGroupedChildren(children);

      return isGrouped
        ? flattenedChildren
        : children;
    },
    [props.children]
  );

  const { getStyles } = props;
  const groupHeadingStyles = getStyles('groupHeading', props);
  const loadingMsgStyles = getStyles('loadingMessage', props);
  const noOptionsMsgStyles = getStyles('noOptionsMessage', props);
  const optionStyles = getStyles('option', props);
  const getHeight = createGetHeight({
    groupHeadingStyles,
    noOptionsMsgStyles,
    optionStyles,
    loadingMsgStyles,
  });

  const heights = useMemo(() => children.map(getHeight), [children]);
  const currentIndex = useMemo(() => getCurrentIndex(children), [children]);

  const itemCount = children.length;

  // calc menu height
  const { maxHeight, paddingBottom = 0, paddingTop = 0, ...menuListStyle } = getStyles('menuList', props);
  const totalHeight = useMemo(() => heights.reduce(sum, 0), [heights]);
  const totalMenuHeight = totalHeight + paddingBottom + paddingTop;
  const menuHeight = Math.min(maxHeight, totalMenuHeight);
  const estimatedItemSize = Math.floor(totalHeight / itemCount);

  const {
    innerRef,
    selectProps,
  } = props;

  const { classNamePrefix, isMulti } = selectProps || {};
  const list = useRef(null);

  // method to pass to inner item to set this items outer height
  const setSizeItemSize = (payload) => {
    setSizes({
      ...sizes,
      [payload.index]: payload.size
    });
  }

  useEffect(
    () => {
      /**
       * not sure why this is necessary
       */
      if (children.length === 1) {
        list.current.resetAfterIndex(0);
      }

      /**
       * enables scrolling on key down arrow
       */
      if (currentIndex >= 0 && list.current !== null) {
        list.current.scrollToItem(currentIndex);
      }
    },
    [currentIndex, children, list]
  );

  return (
    <List
      className={classNamePrefix ? `${classNamePrefix}__menu-list${isMulti ? ` ${classNamePrefix}__menu-list--is-multi`: ''}` : ''}
      style={menuListStyle}
      ref={list}
      outerRef={innerRef}
      estimatedItemSize={estimatedItemSize}
      innerElementType={forwardRef(({ style, ...rest }, ref) => (
        <div
          ref={ref}
          style={{
            ...style,
            height: `${ parseFloat(style.height) + paddingBottom + paddingTop }px`
          }}
          {...rest}
        />
      ))}
      height={menuHeight}
      itemCount={itemCount}
      itemData={children}
      itemSize={index => sizes[index] || heights[index]}
    >
    {({ data, index, style}) => (
      <div className="react-window-item" style={style}>
        <DropdownItem 
          data={data[index]} 
          index={index}  
          setSize={setSizeItemSize}
        />
      </div>
    )}
    </List>
  );
}
export default MenuList;
