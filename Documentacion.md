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

Para cumplir con estos objetivos, se desarrollarán los siguientes componentes principales:
* **Interfaz de Usuario (Frontend Web):** Panel interactivo responsivo para la recepción, mecánicos, cajeros y administradores. Debe ofrecer actualización visual rápida de estados de reparación, escaneo/búsqueda de refacciones y alertas de inventario.
* **Servicio Backend (API REST / WebSockets):** Servidor encargado de la lógica de negocio, reglas de cálculo de presupuestos (repuestos + mano de obra + impuestos), autenticación basada en roles y gestión de concurrencia.
* **Motor de Inventario y Transacciones (Core Operativo):** Mecanismo de alta integridad que garantiza la sincronización bidireccional inmediata: al asignar una refacción a una Orden de Trabajo, se descuenta de inmediato del stock y se actualiza el costo proyectado.
* **Capa de Persistencia de Datos:** Manejo de datos estructurados para transacciones financieras, operativas y catálogos, con capacidad de auditoría de movimientos.

### 1.2 Requisitos Funcionales y No Funcionales Condicionantes
* **Concurrencia e Integridad de Datos:** Múltiples usuarios (recepción, mecánicos y almacén) operarán de forma simultánea. Las operaciones de descuento de inventario deben ser atómicas para prevenir condiciones de carrera (evitar vender refacciones sin stock real).
* **Tiempo Real:** Notificaciones visuales e inmediatas de stock crítico sobrepasado y actualización del estatus de vehículos en reparación.
* **Seguridad y Control de Acceso (RBAC):** Permisos diferenciados por rol (Administrador, Recepcionista, Mecánico, Cajero) para proteger datos sensibles y restringir modificaciones en presupuestos o inventarios.
* **Rendimiento:** Tiempos de respuesta menores a 1.5 segundos en la búsqueda de historial de vehículos por cliente, VIN o placas.

### 1.3 Restricciones de Integración, Seguridad e Infraestructura
* **Seguridad:** Cifrado de contraseñas mediante hashing seguro (Argon2id/Bcrypt), uso obligatorio de HTTPS y tokens JWT con expiración para sesiones de usuario.
* **Infraestructura y Despliegue:** Despliegue mediante contenedores Docker y Docker Compose para asegurar paridad entre el entorno de desarrollo local y la producción.
* **Integración:** Capacidad de generación e impresión de documentos en formato PDF para Órdenes de Trabajo, presupuestos y comprobantes de recepción/pago.

---

## 2. Selección de Lenguajes de Programación

Para la capa de backend y lógica del sistema, se investigaron y compararon dos alternativas de desarrollo moderno:

### 2.1 Comparativa de Alternativas

| Criterio | Opción A: TypeScript (Node.js / NestJS) | Opción B: Python (FastAPI / Django) |
| :--- | :--- | :--- |
| **Compatibilidad con Requisitos** | Excelente para arquitecturas orientadas a eventos e I/O intensivo (descuentos simultáneos e hilos de ejecución ligeros). | Alta mantenibilidad, excelente para análisis de datos, pero menor velocidad nativa en alta concurrencia I/O. |
| **Tipado y Mantenibilidad** | Tipado estático fuerte (TypeScript) que reduce errores en tiempo de ejecución y facilita la refactorización. | Tipado dinámico con soporte opcional de *Type Hints*. |
| **Desarrollo Full-Stack** | Comparte tipos, interfaces y DTOs entre el Frontend (React/TypeScript) y Backend. | Requiere duplicar las definiciones de tipos entre el Frontend y el Backend. |
| **Seguridad y Ecosistema** | Integración nativa con ORMs (Prisma, TypeORM), esquemas de validación estricta (`class-validator`) e inyección de dependencias. | Esquema de seguridad robusto nativo en Django; requiere dependencias adicionales en FastAPI (Pydantic). |
| **Viabilidad y Ecosistema IA** | Soporte completo de SDKs oficiales para modelos LLM (OpenAI, Gemini SDKs). | Lenguaje estándar para integración con herramientas de inteligencia artificial y ciencia de datos. |

### 2.2 Lenguaje Seleccionado
* **Lenguaje Seleccionado:** **TypeScript** (con framework **NestJS** en Backend y **React** en Frontend).
* **Componentes donde se aplicará:**
  * **Frontend:** Interfaz de recepción de autos, tableros Kanban de órdenes de trabajo, catálogo e inventario visual.
  * **Backend:** Endpoints API REST, controladores de autenticación, validación de DTOs, WebSockets para alertas e integración con la base de datos.

### 2.3 Justificación y Limitaciones
* **Justificación:** TypeScript permite unificar el lenguaje en todo el stack técnico (Frontend y Backend), reduciendo la curva de aprendizaje y el cambio de contexto del equipo. NestJS proporciona una arquitectura modular basada en buenas prácticas (Inyección de Dependencias, controladores, servicios y módulos) compatible con la generación de código mediante IA.
* **Limitaciones Identificadas:** Mayor consumo de memoria RAM en comparación con lenguajes compilados nativos (como Go o Rust) y la necesidad de un proceso de transpilación/compilación previo a la ejecución.

---

## 3. Selección de Manejadores de Bases de Datos

Se evaluaron dos tecnologías de almacenamiento atendiendo a la estructura transaccional y catálogo del taller:

### 3.1 Comparativa de Manejadores de Bases de Datos

| Criterio | Opción A: PostgreSQL (Relacional) | Opción B: MongoDB (Documental / NoSQL) |
| :--- | :--- | :--- |
| **Modelo de Datos** | Relacional (Tablas, llaves foráneas, esquemas estrictos) + soporte para campos `JSONB`. | Documental basado en colecciones de documentos JSON/BSON con esquemas flexibles. |
| **Integridad y Consistencia** | Cumplimiento **ACID** estricto nativo. Garantiza integridad referencial entre clientes, vehículos, OTs e inventario. | Cumplimiento ACID por documento; requiere configuraciones especiales para transacciones entre colecciones. |
| **Consultas Operativas** | Consultas SQL complejas mediante `JOIN` entre Clientes, Vehículos, Historial de OT y Repuestos. | Agregaciones complejas (`$lookup`), menos eficientes para estructuras altamente interrelacionadas. |
| **Control de Concurrencia** | Bloqueo a nivel de filas (*Row-Level Locking*) ideal para evitar ventas sin stock disponible. | Puede presentar problemas de consistencia eventual si no se configura explícitamente en réplicas. |
| **Costo y Licencia** | Código abierto (Licencia PostgreSQL), costo $0. | Código abierto (SSPL) / Opción comercial. |

### 3.2 Manejador Seleccionado
* **Manejador Seleccionado:** **PostgreSQL** (interactuando a través del ORM **Prisma**).
* **Justificación:** El sistema de "Las Caninas" administra registros de facturación, repuestos con precios y trazabilidad operativa de reparaciones. La garantía **ACID** de PostgreSQL es crítica para evitar descuadres en caja e inconsistencias en inventario. Además, el soporte de tipos de datos `JSONB` permite guardar listas flexibles de inspección física (check-in de estado del auto) sin romper el diseño relacional.

---

## 4. Restricciones Técnicas y Criterios de Aceptación

### 4.1 Restricciones Técnicas del Desarrollo
1. **Stack Tecnológico:** Backend en NestJS (TypeScript), Frontend en React (TypeScript) y Base de Datos PostgreSQL.
2. **Autenticación y Sesiones:** Implementación de JWT (JSON Web Tokens) con caducidad de 8 horas. Las contraseñas deben cifrarse con el algoritmo Argon2id o Bcrypt.
3. **Documentación de API:** La API Backend debe incluir Swagger/OpenAPI generado automáticamente en la ruta `/api/docs`.
4. **Despliegue e Infraestructura:** El entorno de desarrollo debe ejecutarse mediante un archivo `docker-compose.yml` que levante la API, el cliente web y la base de datos PostgreSQL.

### 4.2 Funcionalidades Clave y Criterios de Aceptación

#### Funcionalidad 1: Descuento Automático de Inventario por Orden de Trabajo (OT)
* **Criterio 1.1:** Al agregar y confirmar una refacción dentro de una Orden de Trabajo activa, el sistema debe descontar automáticamente del inventario la cantidad indicada en un tiempo menor a 1 segundo.
* **Criterio 1.2:** Si la cantidad requerida en la OT es mayor al stock disponible en el almacén, el sistema debe denegar la transacción, impedir el registro de la pieza y mostrar una alerta clara de "Stock Insuficiente".

#### Funcionalidad 2: Alertas de Stock Mínimo y Sugerencia de Reabastecimiento
* **Criterio 2.1:** Cuando el stock de un producto sea igual o menor a su "Stock Mínimo" configurado, el sistema debe cambiar de inmediato el estado del producto a "Alerta de Stock" e incluirlo en la vista de insumos por reabastecer.
* **Criterio 2.2:** El sistema debe permitir al administrador generar una vista previa/borrador de la Orden de Compra agrupando automáticamente todas las refacciones bajo el umbral de reorden.

#### Funcionalidad 3: Registro de Check-In del Vehículo
* **Criterio 3.1:** El formulario de recepción debe registrar datos del auto (Marca, Modelo, Año, Placas, VIN, Kilometraje) y el estado físico de recepción (nivel de gasolina, rayones/golpes mediante checklist interactivo).
* **Criterio 3.2:** Al finalizar el registro, el sistema debe generar una ficha en PDF no editable vinculada a la Orden de Trabajo para firma de conformidad del cliente.

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
La herramienta de IA devolvió las siguientes observaciones sobre la especificación inicial:

1. **Ambigüedad en el cálculo de horas de mano de obra:** Se detectó que el documento mencionaba el costo de mano de obra, pero no especificaba si este se calculaba con una tarifa fija global por hora o con precios prefijados según el tipo de servicio.
2. **Omisión del flujo de devolución de refacciones:** La IA identificó que no se describía el procedimiento a seguir cuando una Orden de Trabajo se cancela o cuando una pieza asignada finalmente no se instala en el vehículo.
3. **Falta de claridad en la gestión de pagos:** Se señaló la falta de definición sobre si el sistema se integraría con pasarelas de pago digitales (p. ej., Stripe) o si solo registraría el medio de pago en efectivo/transferencia para el corte de caja.

---

### 5.3 Correcciones y Ajustes Realizados por el Equipo
El equipo evaluó los hallazgos y realizó las siguientes correcciones en la especificación:

1. **Definición de Mano de Obra:** Se estipuló que cada servicio estándar (p. ej., cambio de aceite, afinación) tendrá un precio fijo prefijado en el catálogo de servicios, permitiendo al mecánico/administrador ajustar las horas únicamente en trabajos correctivos no estandarizados.
2. **Política de Devolución a Inventario:** Se incorporó la regla de negocio: *"Si una OT se cancela o se elimina un ítem antes del cierre, las refacciones descontadas retornarán automáticamente al stock disponible bajo un registro de ajuste tipo 'Devolución por OT cancelada/modificada'."*
3. **Alcance de Pagos y Facturación:** Se especificó que la versión actual del sistema solo registrará la forma de pago (Efectivo, Tarjeta de Débito/Crédito, Transferencia) para la liquidación de la OT y la emisión de comprobantes internos, dejando la facturación con timbrado fiscal electrónico como una fase posterior.

---

## 6. Fuentes Oficiales Consultadas

* **TypeScript Documentation:** https://www.typescriptlang.org/docs/
* **NestJS Documentation:** https://docs.nestjs.com/
* **React Documentation:** https://react.dev/
* **PostgreSQL Documentation:** https://www.postgresql.org/docs/
* **Prisma ORM Documentation:** https://www.prisma.io/docs/
* **Docker Documentation:** https://docs.docker.com/
```eof
