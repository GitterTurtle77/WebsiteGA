import { Dispatch, useState, ReactElement, useEffect } from 'react';
import YAML from 'yaml';
import TranslationInjection from './TranslationInjection';

let storeLocale: (locale: string) => void = (locale) => {
  if (window && window.localStorage) window.localStorage.setItem('locale', locale);
};
let instanceList: Array<{ text: string; dispatch: Dispatch<string | JSX.Element>; key?: string }> = [];
let importedLocale: Map<string, string> = null;

/**
 * Wrap text with this element to get automatic translation injection from locale.
 * This is not case sensitive, but punctuation still matters.
 * When no translation is available, it will leave the original text untouched.
 * @example ```html
 * <TranslatableText>This text can be automatically translated</TranslatableText>
 * ```
 */
const TranslatableText = ({ children, injKey }: { children: string; injKey?: string }) => {
  let fetchedTranslation = importedLocale?.get(children.toLowerCase());
  let initialState: string | JSX.Element = fetchedTranslation ? fetchedTranslation : children;
  if (injKey && fetchedTranslation) initialState = TranslationInjection(injKey, fetchedTranslation);
  const [translatedText, setTranslatedText] = useState<string | JSX.Element>(initialState);
  useEffect(() => {
    let item = { text: children, key: injKey, dispatch: setTranslatedText };
    instanceList.push(item);
    return () => {
      let index = instanceList.indexOf(item);
      if (index !== -1) instanceList.splice(index, 1);
    };
  }, []);
  return translatedText as unknown as ReactElement;
};

/**
 * Updates all the translatable text to a set locale
 * @param locale A locale code for the website to update to (lowercase-UPPERCASE)
 */
const setLocale: (locale: string) => void = async (locale) => {
  storeLocale(locale);
  importedLocale = await YAML.parse(await (await fetch(`/assets/lang/${locale}.yaml`)).text(), {
    mapAsMap: true
  });
  if (!importedLocale) return console.warn('Importing localisation failed.');
  instanceList.forEach((instance) => {
    let translatedText = importedLocale.get(instance.text.toLowerCase());
    if (!translatedText) {
      return instance.dispatch(instance.text);
    }
    if (instance.key) {
      return instance.dispatch(TranslationInjection(instance.key, translatedText));
    }
    instance.dispatch(translatedText);
  });
};

export { TranslatableText, setLocale };
