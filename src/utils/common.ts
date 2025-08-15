export const enumToNumbersArray = (inputEnum: { [key: string]: string | number }): number[] => {
  return Object.values(inputEnum).filter((value) => typeof value === 'number') as number[]
}
