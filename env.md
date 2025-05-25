# Variables de entorno DB
DB_AUTOLOADENTITIES=true # Asegura que al crear una nueva entidad esta se migre a la BD automaticamente !
DB_SYNCRONIZE=true # Asegura que los modelos se migren automaticamnete a las BD, !En produccion se deja en false porque sobrescribiria o generaria errores
DB_PORT=5432
DB_USERNAME=root
DB_PASSWORD=root
DB_HOST=localhost
DB_NAME=visenture


# Variables de entorno Token de 2MFA
2MFA_EXPIRATION_TOKEN=10  # Este valor se maneja en minutos 

# Variables de entorno EMAIL_SERVICE 
MAIL_SERVICE=gmail
MAIL_ADDRESS=accionesudinc@gmail.com
MAIL_PASS=ohdmbtrawnckzezu     # Esta pass es una clave especial generado en el proveedor de correo como clave de aplicacion 


# Variables de entorno JWT
JWT_SECRET=a8f4dc2c26ab9b88cb41556b78612266e16b127821e50e2b7749f12f532413060c055456cb52540b873f1195df5faaee481842c6c2b10f478c4d7db90e09cb1a51da262ef8dc52b27700abd0220e97bcb2ee0fe4dfc750e9913aa3a4e352cd445a555348163d73d11c7ce88c024cc684efdeff2b31f08cd8a1489483dcbb22eafc21856ebd09e62f465991296733b1b425f683b1d2e8dfaeda7f2255668dd96ca955404eec097245dd6688d1f8b091df922077237cdfde727d920762633
JWT_EXPIRES_IN=1h
