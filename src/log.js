import { locale } from "./variables.js";

const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };

export default function log(text) {

  const date = new Date().toLocaleString(locale, options)
  console.log(date + ': ' + text)
}