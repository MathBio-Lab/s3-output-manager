Opción A — “Next.js + S3”: tu app Next.js (servidor HTTP/SSR o API) alojada en un servidor pequeño (ej. EC2 t3.small) o en Amplify, y los ficheros (uploads/downloads/list/delete) en Amazon S3 (posible uso de CloudFront para servir descargas).

Opción B — “SFTP con AWS Transfer Family”: habilitar un endpoint SFTP de Transfer Family que lea/escriba directamente en S3 (los usuarios usan SFTP para CRUD).

Principales precios usados (fuentes oficiales)

S3: costos de almacenamiento y requests (GET/PUT ~ $0.0004 / $0.005 por 1k requests; coste por GB de almacenamiento ~ ~$0.023/GB dependiendo de la clase y volumen). 
Amazon Web Services, Inc.
+1

EC2 t3.small (ejemplo de instancia pequeña): ~ $0.0208/hora (~$15/mes si está 24×7). 
instances.vantage.sh
+1

AWS Amplify (si usas hosting SSR — tiene componentes de precio que pueden aplicarse, pero para comparar uso EC2 como referencia barata). 
Amazon Web Services, Inc.

AWS Transfer Family: $0.30 por hora por protocolo (SFTP) (≈ $216/mes si 24×7) y $0.04/GB por datos transferidos vía SFTP (ejemplos y desglose en la doc). 
Amazon Web Services, Inc.

Comparación rápida (ejemplo numérico)

Supongamos un caso intermedio (ejemplo realista):

Almacenamiento en S3: 100 GB

Transferencia total (uploads+downloads hacia/desde usuarios por mes): 200 GB

Número de requests: 10.000 PUTs y 100.000 GETs (sólo para dimensionar coste de requests)

Opción A — Next.js + S3 (EC2 t3.small como servidor)

EC2 t3.small: 0.0208 USD/h * 24 * 30 ≈ $15 / mes. 
instances.vantage.sh

S3 almacenamiento: 100 GB * $0.023/GB ≈ $2.30 / mes. 
nOps

S3 requests:

PUT: 10k /1000 * $0.005 ≈ $0.05

GET: 100k /1000 * $0.0004 ≈ $0.04. 
Amazon Web Services, Inc.

Data transfer (ej. S3 -> Internet): si sirves directamente desde S3 sin CDN, uso de ejemplo $0.09/GB * 200 GB = $18 (nota: usando CloudFront puedes reducir mucho este coste: CloudFront tiene tarifas más bajas y la primera TB puede ser gratuita en ciertas condiciones). 
Amazon Web Services, Inc.
+1

Total aproximado Opción A ≈ $15 + $2.30 + $0.09 + $18 = ≈ $35.4 / mes (si no usas CloudFront). Con CloudFront puede ser sustancialmente menor en transferencia.

Opción B — AWS Transfer Family (SFTP)

Endpoint SFTP: $0.30/h * 24 * 30 = $216 / mes. 
Amazon Web Services, Inc.

Transfer via SFTP: $0.04/GB * 200 GB = $8. 
Amazon Web Services, Inc.

S3 almacenamiento & requests: mismos $2.30 + ~$0.09 ≈ $2.4 (S3 sigue cobrando almacenamiento/requests; Transfer Family sólo envía/recibe datos hacia S3). 
Amazon Web Services, Inc.
+1

Total aproximado Opción B ≈ $216 + $8 + $2.4 = ≈ $226.4 / mes

Conclusión práctica y regla rápida

Para la gran mayoría de apps web con uploads/downloads mediante HTTP(S) (web UI, navegadores, apps modernas): hostear Next.js + S3 (y poner CloudFront delante) suele ser mucho más barato que usar Transfer Family. En el ejemplo medio anterior la diferencia es clara (~$35/mes vs ~$226/mes). Fuentes: S3, EC2, Transfer Family. 
Amazon Web Services, Inc.
+2
instances.vantage.sh
+2

Transfer Family está pensado para casos donde necesitas SFTP/FTPS/AS2 nativo (clientes legacy, integración B2B, cumplimiento que exige SFTP). Tiene un coste fijo alto por endpoint (~$0.30/h) que lo hace caro para tráfico pequeño/medio. 
Amazon Web Services, Inc.

Break-even (cuándo Transfer Family podría valer la pena)

Si la única diferencia fuera el coste por GB, Transfer Family cobra $0.04/GB mientras que servir desde S3 directamente a internet puede costar ~ $0.09/GB (sin CDN) — ahorras ≈ $0.05/GB al usar Transfer Family. Con ese diferencial, para cubrir el coste fijo del endpoint (~$216/mes) necesitarías mover ~4,320 GB / mes (216 ÷ 0.05) solo en transferencias para empatar. Si usas CloudFront (que baja mucho el coste por GB) el punto de quiebre es aún mucho más alto, es decir Transfer Family rara vez compensa por precio salvo que necesites SFTP por obligación. (Cálculos y precios: Transfer Family & S3). 
Amazon Web Services, Inc.
+1

Recomendación

Si no necesitas SFTP: haz Next.js + S3 + CloudFront. Es más barato, escalable y te da mejor control de UX (presigned URLs para uploads, API para listar/borrar, etc.).

Si NECESITAS SFTP (clientes que solo se conectan por SFTP, integraciones B2B, requisitos legales): usa Transfer Family, pero espera pagar el cargo fijo por endpoint; considera arquitecturas híbridas (p. ej. Transfer Family para partners legacy + una API HTTP moderna para usuarios web) para optimizar costes. 
Amazon Web Services, Inc.
+1

Si quieres, hago esto a continuación (gratis y ahora mismo)

Puedo:

Calcular un presupuesto exacto para tu caso si me das: región AWS, GB almacenados, GB transferidos/mes, número de uploads/downloads por mes y si necesitas SFTP para algunos usuarios.

Sugerir arquitectura concreta (presigned URLs, IAM policy mínima, CDN + caching headers, cómo gestionar borrado/listado seguro) y estimación de costos con granularidad (storage, requests, data-out, compute).

Dime si quieres que haga la estimación exacta con tus números (región y volúmenes) y lo calculo ahora mismo.

## Deployment con Docker

### 1. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus valores de AWS y PostgreSQL.

### 2. Iniciar los contenedores

```bash
docker compose up --build -d
```

Esto construye las imágenes y levanta los servicios (PostgreSQL + Next.js).

### 3. Aplicar migraciones de base de datos

```bash
docker compose exec nextjs-s3-app npx prisma migrate deploy
```

### 4. Poblar la base de datos (opcional)

```bash
docker compose exec nextjs-s3-app npx prisma db seed
```

Esto crea usuarios de prueba:
- **admin** / admin (tipo: admin)
- **client1** / client123 (tipo: client, prefix: karen)
- **team1** / team123 (tipo: team)

### 5. Acceder a la aplicación

Abre tu navegador en: **http://localhost:3000**

### Comandos útiles

```bash
# Ver logs
docker compose logs -f nextjs-s3-app

# Reiniciar servicios
docker compose restart

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (⚠️ borra la base de datos)
docker compose down -v
```
