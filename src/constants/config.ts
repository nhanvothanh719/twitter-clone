import argv from 'minimist'
const passedOptions = argv(process.argv.slice(2))

export const isProduction = Boolean(passedOptions.production)
