
"use client";

import { useMemo, Children, ReactNode, isValidElement } from 'react';

type AnimatedTextProps = {
  children: ReactNode;
  progress?: number; // Optional progress for scroll-based animation
};

const getCharacters = (node: ReactNode): (string | ReactNode)[] => {
  if (typeof node === 'string') {
    return node.split('');
  }
  if (isValidElement(node) && node.props.children) {
    if (typeof node.props.children === 'string') {
        const words = node.props.children.split(' ');
        const styledWords = words.map((word, index) => (
            <span key={index} className={node.props.className}>
                {word}{index < words.length - 1 ? ' ' : ''}
            </span>
        ));
        return styledWords.flatMap(getCharacters);
    }
    return Children.toArray(node.props.children).flatMap(getCharacters);
  }
  if (isValidElement(node) && !node.props.children) {
    return [node];
  }
  return [];
};


export const AnimatedText = ({ children, progress = 1 }: AnimatedTextProps) => {
    const characters = useMemo(() => {
        let chars: (string | ReactNode)[] = [];
        Children.forEach(children, child => {
            if (typeof child === 'string') {
                chars.push(...child.split(''));
            } else if (isValidElement(child)) {
                if (child.props.children && typeof child.props.children === 'string') {
                     // It's a styled element like <span>...</span>
                     chars.push(child);
                } else if (child.props.children) {
                     // It has nested elements
                     chars.push(...getCharacters(child));
                } else {
                    chars.push(child);
                }
            }
        });
        return chars;
    }, [children]);

    const charsToShow = Math.floor(progress * characters.length);

    return (
        <span className="inline-block w-full">
        {characters.map((char, i) => {
            const isVisible = i < charsToShow;
            if (typeof char === 'string') {
            return (
                <span
                key={i}
                className="transition-opacity duration-150"
                style={{ opacity: isVisible ? 1 : 0.2, display: 'inline' }}
                >
                {char}
                </span>
            );
            }
            // It's a React element (e.g., styled <span>)
            return (
                <span key={i} style={{ opacity: isVisible ? 1 : 0.2, transition: 'opacity 150ms' }}>
                    {char}
                </span>
            );
        })}
        </span>
    );
};
