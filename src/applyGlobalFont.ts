import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

/**
 * Makes "Smooch Sans" the default font for every <Text> in the app.
 *
 * React Native has no global font setting, so we patch Text's render to inject
 * the font family. The font ships as one static .ttf per weight
 * (SmoochSans-300 … SmoochSans-800); we resolve the text's fontWeight to the
 * nearest available file and clear fontWeight so the platform doesn't
 * synthesize a faux-bold on top of an already-weighted face.
 */
const WEIGHTS = [300, 400, 500, 600, 700, 800];

function familyFor(weight: TextStyle['fontWeight']): string {
  let w = 400;
  if (typeof weight === 'number') {
    w = weight;
  } else if (typeof weight === 'string') {
    if (weight === 'bold') {
      w = 700;
    } else if (weight === 'normal') {
      w = 400;
    } else {
      const parsed = parseInt(weight, 10);
      if (!Number.isNaN(parsed)) {
        w = parsed;
      }
    }
  }
  const nearest = WEIGHTS.reduce((a, b) =>
    Math.abs(b - w) < Math.abs(a - w) ? b : a,
  );
  return `SmoochSans-${nearest}`;
}

const TextAny = Text as unknown as {
  render?: (props: any, ref: any) => React.ReactElement<any>;
  __smoochPatched?: boolean;
};

if (TextAny.render && !TextAny.__smoochPatched) {
  const originalRender = TextAny.render;
  TextAny.render = function patchedRender(props: any, ref: any) {
    const flat = (StyleSheet.flatten(props.style) || {}) as TextStyle;
    const fontFamily = familyFor(flat.fontWeight);
    const element = originalRender.call(this, props, ref);
    return React.cloneElement(element as React.ReactElement<any>, {
      style: [element.props.style, { fontFamily, fontWeight: 'normal' }],
    });
  };
  TextAny.__smoochPatched = true;
}
