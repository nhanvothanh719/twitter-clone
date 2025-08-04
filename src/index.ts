type Handle = () => Promise<string>
const message = 'The application is running!'
const myFunc: Handle = () => Promise.resolve(message)

myFunc().then((res) => console.log(res))
myFunc().then(console.log)
