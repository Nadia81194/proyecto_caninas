# Documentación Técnica y Actualización del PRD
## Sistema de Gestión Operativa y Control de Inventarios — Taller Mecánico "Las Caninas"

**Integrantes del Equipo:**
* Nadia Coria Aragón
* Aylin Nayara López Guzmán
* Braulio Paniagua García
* Elías Alejandro León Zamora

---

## 1. Identificación de Necesidades Tecnológicas

### 1.1 Síntesis del Sistema y Componentes a Desarrollar
El sistema para el **Taller Mecánico Las Caninas** es una plataforma de gestión operativa (ERP ligero) dividida en dos módulos principales e interconectados:
1. **Módulo de Gestión del Taller:** Recepción de vehículos, expediente del cliente/auto, generación de presupuestos, emisión y seguimiento de Órdenes de Trabajo (OT) y facturación/cierre de tickets.
2. **Módulo de Control de Inventario y Almacén:** Catálogo de refacciones y fluidos, movimientos de entrada/salida en tiempo real, alertas de stock mínimo, punto de reorden y gestión de proveedores.

Para cumplir con estos objetivos, se desarrollarán y conectarán los siguientes componentes principales:
* **Interfaz de Usuario Web (Frontend):** Construida con **HTML5, CSS3 y JavaScript/TypeScript (React)**. Proporciona un panel interactivo y responsivo para recepción, mecánicos, cajeros y administradores, permitiendo la visualización de órdenes de trabajo, el escaneo de piezas y alertas visuales.
* **Capa de Lógica de Negocio y Backend:** Servidor desarrollado en **TypeScript (Node.js / NestJS)** encendido sobre APIs REST y WebSockets, encargado de reglas de cálculo de presupuestos (repuestos + mano de obra + impuestos), validación de roles y control transaccional.
* **Infraestructura de Datos y Backend-as-a-Service (Supabase / PostgreSQL):** Plataforma de persistencia basada en el motor relacional **PostgreSQL**, aprovechando la suite de **Supabase** para la autenticación inmediata de usuarios, gestión de políticas de seguridad a nivel de filas (RLS) y actualización en tiempo real de tablas clave.

### 1.2 Requisitos Funcionales y No Funcionales Condicionantes
* **Concurrencia e Integridad de Datos:** Múltiples usuarios operando simultáneamente. Las operaciones de descuento de inventario deben ser atómicas mediante transacciones de PostgreSQL para prevenir condiciones de carrera (evitar vender refacciones sin stock real).
* **Tiempo Real:** Notificaciones visuales e inmediatas de stock crítico sobrepasado a través de suscripciones en tiempo real de Supabase y WebSockets.
* **Seguridad y Control de Acceso (RBAC):** Permisos diferenciados por rol (Administrador, Recepcionista, Mecánico, Cajero) utilizando autenticación mediante Supabase Auth y tokens JWT.
* **Rendimiento:** Tiempos de respuesta menores a 1.5 segundos en la búsqueda e interactividad web construida con HTML5 y llamadas asíncronas a la base de datos.

### 1.3 Restricciones de Integración, Seguridad e Infraestructura
* **Seguridad:** Cifrado de contraseñas, conexión cifrada por HTTPS, uso de Row Level Security (RLS) en Supabase y tokens JWT con expiración para sesiones de usuario.
* **Infraestructura y Despliegue:** Despliegue del cliente web (HTML/CSS/JS) y servicios backend containerizados vía Docker / Vercel con vinculación directa al proyecto de Supabase.
* **Integración:** Capacidad de generación e impresión de documentos en formato PDF para Órdenes de Trabajo, presupuestos y comprobantes de recepción/pago.

---

## 2. Selección de Lenguajes de Programación y Maquetación Web

Para el desarrollo del cliente web y la lógica del backend, se evaluó la integración de maquetación nativa y lenguajes de programación modernos:

### 2.1 Comparativa de Alternativas

| Criterio | Opción A: HTML5 + CSS3 + JavaScript / TypeScript (Node.js/NestJS) | Opción B: Python (FastAPI / HTML Templates con Jinja2) |
| :--- | :--- | :--- |
| **Tecnología Frontend** | **HTML5 y CSS3** para maquetación e interfaz responsiva, combinados con **TypeScript/JavaScript** para interactividad dinámica. | Plantillas Jinja2 renderizadas desde el servidor Python o clientes desacoplados. |
| **Compatibilidad con Requisitos** | Excelente para interfaces web ligeras y servicios I/O intensivos en tiempo real con Supabase. | Alta mantenibilidad, pero mayor latencia en renderizado de plantillas y actualización reactiva de interfaz. |
| **Desarrollo Full-Stack** | Unifica lenguaje en JavaScript/TypeScript, compartiendo interfaces de datos con el cliente web (HTML/CSS/JS). | Requiere coordinar sintaxis de plantillas Python con código JavaScript cliente. |
| **Seguridad y Ecosistema** | Integración transparente con SDK de Supabase JS, esquemas de validación estricta y controladores de NestJS. | Seguridad robusta en Django/FastAPI; requiere configuraciones manuales para clientes JavaScript. |

### 2.2 Tecnologías Seleccionadas
* **Maquetación e Interfaz Visual (Frontend):** **HTML5 y CSS3** (utilizando librerías de estilos responsivos) junto con **JavaScript / TypeScript (React)**.
* **Lenguaje Backend:** **TypeScript (Node.js con NestJS)** para la lógica de negocio central.
* **Componentes donde se aplicarán:**
  * **Frontend (HTML/CSS/JS):** Diseño visual del panel de recepción de vehículos, formularios de check-in, tableros de control de órdenes de trabajo y alertas de inventario.
  * **Backend (TypeScript):** Endpoints API REST, validaciones complejas de inventario, reglas de cálculo y controladores transaccionales.

### 2.3 Justificación y Limitaciones
* **Justificación:** HTML5 y CSS3 constituyen el estándar universal para la maquetación de interfaces web accesibles e intuitivas para el personal del taller mecánico. La adopción de TypeScript en todo el flujo facilita la comunicación cliente-servidor, permitiendo conectar la web de manera nativa con Supabase y el servidor NestJS.
* **Limitaciones Identificadas:** El renderizado del lado del cliente requiere asegurar un manejo eficiente del estado en JavaScript para evitar lentitud visual si el taller maneja catálogos de piezas muy extensos en pantallas simultáneas.

---

## 3. Selección de Manejadores de Bases de Datos e Infraestructura de Datos

Para el almacenamiento de datos transaccionales del taller, se analizó el uso de **PostgreSQL** administrado a través de la plataforma **Supabase**.

### 3.1 Comparativa de Manejadores e Infraestructura

| Criterio | Opción A: PostgreSQL con Supabase (BaaS) | Opción B: MongoDB (Documental / NoSQL) |
| :--- | :--- | :--- |
| **Modelo de Datos** | Relacional (PostgreSQL) con tablas, llaves foráneas y campos `JSONB` + API instantánea de Supabase. | Documental basado en colecciones BSON con esquemas flexibles. |
| **Integridad y Consistencia** | Cumplimiento **ACID** estricto nativo. Garantiza la integridad referencial entre clientes, vehículos, OTs e inventario. | ACID a nivel de documento; requiere configuraciones complejas para transacciones entre múltiples colecciones. |
| **Tiempo Real y Autenticación** | Supabase proporciona motor Realtime nativo y Auth integrado directamente sobre PostgreSQL. | Requiere integrar servicios externos como Firebase o configurar websockets manuales. |
| **Control de Concurrencia** | Bloqueo transaccional de PostgreSQL ideal para evitar ventas sin stock en el almacén de refacciones. | Puede presentar inconsistencias en lecturas concurrentes si no se configuran réplicas estrictas. |
| **Costo y Licenciamiento** | PostgreSQL (Código abierto, Licencia libre). Supabase ofrece nivel gratuito (*Free Tier*) suficiente para el semestre. | Opción comercial / Código abierto (SSPL). |

### 3.2 Manejador Seleccionado
* **Manejador Seleccionado:** **PostgreSQL** (alojado y administrado a través de **Supabase**).
* **Justificación:** La operación del taller "Las Caninas" exige consistencia estricta en la facturación y el inventario. PostgreSQL asegura que no existan desbalances ni lecturas sucias en las refacciones. Además, **Supabase** simplifica el desarrollo al proveer la infraestructura de PostgreSQL lista en la nube, incluyendo autenticación (Auth), almacenamiento de archivos y suscripciones en tiempo real que se conectan directamente con la interfaz desarrollada en HTML/CSS/JavaScript.

---

## 4. Restricciones Técnicas y Criterios de Aceptación

### 4.1 Restricciones Técnicas del Desarrollo
1. **Stack Tecnológico:** Frontend en HTML5, CSS3 y JavaScript/TypeScript (React); Backend en NestJS (TypeScript); Base de datos PostgreSQL mediante la plataforma Supabase.
2. **Autenticación y Sesiones:** Integración de Supabase Auth con tokens JWT y caducidad de sesión configurable. Cifrado obligatorio de credenciales.
3. **Seguridad en Datos:** Aplicación de políticas *Row Level Security* (RLS) en PostgreSQL para evitar acceso no autorizado a los registros por tipo de usuario.
4. **Despliegue e Infraestructura:** El proyecto se conectará mediante variables de entorno (`SUPABASE_URL`, `SUPABASE_KEY`) con despliegue del cliente web y servicios en entorno local o contenedores Docker.

### 4.2 Funcionalidades Clave y Criterios de Aceptación

#### Funcionalidad 1: Descuento Automático de Inventario por Orden de Trabajo (OT)
* **Criterio 1.1:** Al agregar y confirmar una refacción dentro de una Orden de Trabajo en la interfaz web, el sistema debe ejecutar una transacción en PostgreSQL que descuente automáticamente del inventario la cantidad indicada en un tiempo menor a 1 segundo.
* **Criterio 1.2:** Si la cantidad requerida en la OT supera el stock disponible en el almacén, el sistema debe denegar la transacción en la base de datos y mostrar un mensaje de alerta en HTML/CSS indicando "Stock Insuficiente".

#### Funcionalidad 2: Alertas de Stock Mínimo y Sugerencia de Reabastecimiento
* **Criterio 2.1:** Cuando el stock de un producto sea igual o menor a su "Stock Mínimo" en PostgreSQL, el sistema emitirá un evento en tiempo real vía Supabase para cambiar el estado visual en el dashboard a "Alerta de Stock".
* **Criterio 2.2:** El sistema debe permitir al administrador generar una vista previa/borrador de la Orden de Compra agrupando automáticamente todas las refacciones bajo el umbral de reorden.

#### Funcionalidad 3: Registro de Check-In del Vehículo
* **Criterio 3.1:** El formulario web en HTML/CSS debe registrar datos del auto (Marca, Modelo, Año, Placas, VIN, Kilometraje) y el estado físico de recepción (nivel de gasolina, rayones/golpes mediante checklist interactivo).
* **Criterio 3.2:** Al finalizar el registro, el sistema guardará los datos en PostgreSQL y generará una ficha en PDF no editable vinculada a la Orden de Trabajo para firma de conformidad del cliente.

---

## 5. Validación de la Documentación con Inteligencia Artificial

### 5.1 Prompt Utilizado
Se utilizó la documentación técnica elaborada y se ingresó al modelo de IA mediante el siguiente prompt normalizado:

> **Prompt:**  
> Analiza el documento de requisitos y definición técnica del proyecto que se te proporciona.  
> Sin generar código ni proponer tecnologías adicionales, realiza lo siguiente:  
> 1. Resume el propósito y alcance del sistema.  
> 2. Identifica sus principales usuarios y funcionalidades.  
> 3. Describe la arquitectura y las tecnologías seleccionadas.  
> 4. Identifica las restricciones técnicas que deben respetarse.  
> 5. Señala contradicciones, ambigüedades o información faltante que podría dificultar el desarrollo.  
> No inventes información. Cuando un dato no esté especificado, indícalo expresamente.

---

### 5.2 Observaciones Relevantes de la IA
La herramienta de IA devolvió las siguientes observaciones sobre la especificación técnica:

1. **Ambigüedad en el cálculo de horas de mano de obra:** Se detectó que el documento mencionaba el costo de mano de obra, pero no especificaba si este se calculaba con una tarifa fija global por hora o con precios prefijados según el tipo de servicio.
2. **Omisión del flujo de devolución de refacciones:** La IA identificó que no se describía el procedimiento a seguir cuando una Orden de Trabajo se cancela o cuando una pieza asignada finalmente no se instala en el vehículo.
3. **Falta de claridad en la gestión de pagos:** Se señaló la falta de definición sobre si el sistema se integraría con pasarelas de pago digitales (p. ej., Stripe) o si solo registraría el medio de pago en efectivo/transferencia para el corte de caja.

---

### 5.3 Correcciones y Ajustes Realizados por el Equipo
El equipo evaluó los hallazgos y realizó las siguientes correcciones en la especificación:

1. **Definición de Mano de Obra:** Se estipuló que cada servicio estándar (p. ej., cambio de aceite, afinación) tendrá un precio fijo prefijado en el catálogo de servicios, permitiendo al mecánico/administrador ajustar las horas únicamente en trabajos correctivos no estandarizados.
2. **Política de Devolución a Inventario:** Se incorporó la regla de negocio: *"Si una OT se cancela o se elimina un ítem antes del cierre, las refacciones descontadas retornarán automáticamente al stock disponible en PostgreSQL bajo un registro de ajuste tipo 'Devolución por OT cancelada/modificada'."*
3. **Alcance de Pagos y Facturación:** Se especificó que la versión actual del sistema solo registrará la forma de pago (Efectivo, Tarjeta de Débito/Crédito, Transferencia) para la liquidación de la OT y la emisión de comprobantes internos en la web, dejando la facturación con timbrado fiscal electrónico como una fase posterior.

---

## 6. Fuentes Oficiales Consultadas

* **HTML5 & CSS3 Standards (W3C):** https://www.w3.org/
* **JavaScript / TypeScript Documentation:** https://www.typescriptlang.org/docs/
* **Supabase Documentation:** https://supabase.com/docs
* **PostgreSQL Official Documentation:** https://www.postgresql.org/docs/
* **NestJS Documentation:** https://docs.nestjs.com/
* **Docker Documentation:** https://docs.docker.com/