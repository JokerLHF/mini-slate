// slate 的 ExtendedType 感觉没有什么用啊, 先这样写着把
export type ExtendedType<B> = B extends null ? B : { [key in string]: any } & B

