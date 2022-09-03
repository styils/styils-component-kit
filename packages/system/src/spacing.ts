export const defaultSpacing = 8

export type NumberArgument = number | string

export interface Spacing {
  (
    top?: NumberArgument,
    right?: NumberArgument,
    bottom?: NumberArgument,
    left?: NumberArgument
  ): string
}

export type SpacingOptions =
  | number
  | ((...rest: NumberArgument[]) => NumberArgument)
  | ReadonlyArray<NumberArgument>

export function createUnaryUnit(spacing: SpacingOptions) {
  if (typeof spacing === 'number') {
    return (abs: NumberArgument) => {
      if (typeof abs === 'string') {
        return abs
      }

      if (process.env.NODE_ENV !== 'production') {
        if (typeof abs !== 'number') {
          console.error(
            `ROI: Expected 'spacing' argument to be a 'number' or a 'string', got ${abs}.`
          )
        }
      }
      return spacing * abs
    }
  }

  if (Array.isArray(spacing)) {
    return (abs: NumberArgument) => {
      if (typeof abs === 'string') {
        return abs
      }

      if (process.env.NODE_ENV !== 'production') {
        if (!Number.isInteger(abs)) {
          console.error(
            [
              `ROI: The 'theme.spacing' array type cannot be combined with non integer values.`,
              `You should either use an integer value that can be used as index, or define the 'theme.spacing' as a number.`
            ].join('\n')
          )
        } else if (abs > spacing.length - 1) {
          console.error(
            [
              `ROI: The value provided (${abs}) overflows.`,
              `The supported values are: ${spacing}.`,
              `${abs} > ${spacing.length - 1}, you need to add the missing values.`
            ].join('\n')
          )
        }
      }

      return spacing[abs]
    }
  }

  if (typeof spacing === 'function') {
    return spacing
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(
      [
        `ROI: The 'theme.spacing' value (${spacing}) is invalid.`,
        'It should be a number, an array or a function.'
      ].join('\n')
    )
  }

  return () => undefined
}

export default function spacing(spacingInput: SpacingOptions) {
  const transform = createUnaryUnit(spacingInput)

  const spacing = (...values: Parameters<Spacing>) => {
    if (process.env.NODE_ENV !== 'production') {
      if (values.length > 4) {
        console.error(
          `styils-ui: Too many arguments provided, expected between 0 and 4, got ${values.length}`
        )
      }
    }

    const value = values.length === 0 ? [1] : values

    return value
      .map((argument) => {
        const output = transform(argument!)

        return typeof output === 'number' ? `${output}px` : output
      })
      .join(' ')
  }

  return spacing
}
