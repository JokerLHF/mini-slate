import { SelectionTransforms } from './selection'
import { GeneralTransforms } from './general';
import { NodeTransforms } from './node';
import { TextTransforms } from './text';

export const Transforms: GeneralTransforms & SelectionTransforms & NodeTransforms & TextTransforms = {
  ...GeneralTransforms,
  ...SelectionTransforms,
  ...NodeTransforms,
  ...TextTransforms,
}