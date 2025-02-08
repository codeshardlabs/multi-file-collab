export function isOfType<T>(obj: any, props: (keyof T)[]): obj is T {
  return props.every((prop) => prop in obj);
}

export const shardTemplateOptions = [
  "static"
  , "angular"
  , "react"
  , "react-ts"
  , "solid"
  , "svelte"
  , "test-ts"
  , "vanilla-ts"
  , "vanilla"
  , "vue"
  , "vue-ts"
  , "node"
  , "nextjs"
  , "astro"
  , "vite"
  , "vite-react"
  , "vite-react-ts"
]

export const shardModeOptions = [
  "normal" ,"collaboration"
]

export const shardTypeOptions = [
  "public", "private", "forked"
]