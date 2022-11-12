import { isPlainObject } from 'is-plain-object';
import { ExtendedType } from './custom-types';
import { Range } from './range';

export interface BaseText {
  text: string
}

export type Text = ExtendedType<BaseText>;

/**
 * slate 本身提供的
 */

export interface TextInterface {
  isText: (value: any) => value is Text;
  decorations: (node: Text, decorations: Range[]) => Text[];
}

export const Text: TextInterface = {
  isText(value: any): value is Text {
    return isPlainObject(value) && typeof value.text === 'string';
  },

  /**
   * 依次使用 decorations 对 leaf 进行拆分。
   */
  decorations(node: Text, decorations: Range[]): Text[] {
    let leaves: Text[] = [{ ...node }]
    for (const dec of decorations) {
      
      const { anchor, focus, ...rest } = dec;
      const [start, end] = Range.edges(dec)
      const decorationStart = start.offset;
      const decorationEnd = end.offset;

      let next: Text[] = [];
      let leafEnd = 0;
      for (const leaf of leaves) {
        const leafStart = leafEnd;
        leafEnd += leaf.text.length;

        /**
         * 1. leaf 完全在 decoration 的范围之内
         *   decoration：          -------
         *   leaf 情况:              ----
         */
        if (leafStart >= decorationStart && leafEnd <= decorationEnd) {
          // 【这里的 rest 加在 leaf 上表示 rest 的作用对 leaf 生效】
          Object.assign(leaf, rest);
          next.push(leaf);
          continue;
        }

        let shouldIgnoreSplitLeaf = true;
        /**
         * 2. leaf 不是 collapse
         *   decoration：          -------
         *   leaf 情况1:                  ------
         *   leaf 情况2:      -----
         */
         if (decorationStart !== decorationEnd) {
          shouldIgnoreSplitLeaf = decorationStart >= leafEnd || decorationEnd <= leafStart
        }
        /**
         *  如果是 collapse 的话，
         *     decoration 只会跟前一个一起做拆分
         *     如果前一个是文本的开始节点，就跟开始节点做拆分
         * 
         *  比如：12 decoration 3    decoration 跟 12 一起拆分
         *  比如：decoration 12  3   decoration 跟 12 一起做拆分
         *  比如：12  3  decoration  decoration 跟 3 一起做拆分
         */
        if (decorationStart === decorationEnd) {
          shouldIgnoreSplitLeaf = decorationStart > leafEnd || (decorationEnd <= leafStart && leafStart !== 0)
        }

        if (shouldIgnoreSplitLeaf) {
          next.push(leaf);
          continue;
        }

        /**
         * 3. leaf 部分在 decoration 范围之内, 需要进行分割. 到这里 decoration 有可能是 collapse
         *   decoration：          -------
         *   leaf 情况1:                 ------
         *   leaf 情况2:         -----
         *   leaf 情况3:         ---------------
         */
        let before;
        let after;
        let middle = leaf;

        if (leafEnd > decorationEnd) {
          const distance = decorationEnd - leafStart;
          after = { ...middle, text: middle.text.slice(distance) }
          middle = { ...middle, text: middle.text.slice(0, distance) }
        }

        if (leafStart < decorationStart) {
          const distance = decorationStart - leafStart;
          before = { ...middle, text: middle.text.slice(0, distance) }
          middle = { ...middle, text: middle.text.slice(distance) }
        }

        before && next.push(before);

        // 【这里的 rest 加在 leaf 上表示 rest 的作用对 leaf 生效】, before，after 不生效只做分割
        Object.assign(middle, rest);
        next.push(middle);

        after && next.push(after);
      }

      leaves = next; 
    }

    return leaves;
  }
}