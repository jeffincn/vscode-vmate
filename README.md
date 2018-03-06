# vscode-vmate

vscode extension for vmate

https://github.com/jeffincn/vscode-vmate

## Features

### Support more the standard templates for develop

  1. Create a new `React Template of Vmate` with command `vmate dvaview`.
  2. Create a `Dva Model Tempate` with command `vmate dvamodel`.
  3. Create a `Dva Service Template` with command `vmate dvaservice`.
  4. Create a `Egg Controller Template` initial with  command `vmate controller`.
  5. Create a `Egg Service Template` initial with command `vmate service`.
  6. Create a `Egg Config Item` with command `vmate config item`.
  7. Create a `Entity Template` initial with command `vmate entity`.

### Support snippet string relates `Egg Porject`

In VSCode workspace porject, Where is in root directories has a named name as `backend`. So that under the `backend/app/service/**`, `backend/app/controller/**` would be seeked and built with a snippet string for your vscode interface while you input some keys what is prefix word in `service` or `controller`

These snippet words were bind with these files whatever were created, changed or deleted so much immediately be sensitive.

If not create VSCode workspace to created project, so you should configure that path in your project setting as configuration item just like `vmate.serverRoot='backe/app'`.

## Extension Settings

This extension contributes the following settings:

* `vmate.author`: set author name replace template variable `${TM_AUTHOR}`.
* `vmate.authoremail`: set author name replace template variable `${TM_AUTHOR_EMAIL}`.
* `vmate.serverRoot`: set your project backend root path will be seeked from you project service, controller class file and these method.

## Known Issues

## Resources
- https://code.visualstudio.com/docs/extensionAPI/vscode-api
- https://github.com/Microsoft/vscode-extension-samples

## Release Notes

-----------------------------------------------------------------------------------------------------------
