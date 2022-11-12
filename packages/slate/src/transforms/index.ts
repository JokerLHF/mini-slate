import { SelectionTransforms } from './selection'
import { GeneralTransforms } from './general';

export const Transforms: GeneralTransforms & SelectionTransforms = {
  ...GeneralTransforms,
  ...SelectionTransforms,
}