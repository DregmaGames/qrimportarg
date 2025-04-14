/*
  # Add detailed product information fields

  1. Changes to `productos` table
    - Add new columns for detailed product identification:
      - `marca` (text, required)
      - `modelo` (text, required)
      - `dimensiones` (text, required)
      - `peso` (text, required)
      - `materiales` (text, required)
      - `caracteristicas_tecnicas` (text, required)
      - `capacidades_limitaciones` (text, required)
      - `certificado_url` (text, nullable)
*/

ALTER TABLE productos
ADD COLUMN marca text NOT NULL DEFAULT '',
ADD COLUMN modelo text NOT NULL DEFAULT '',
ADD COLUMN dimensiones text NOT NULL DEFAULT '',
ADD COLUMN peso text NOT NULL DEFAULT '',
ADD COLUMN materiales text NOT NULL DEFAULT '',
ADD COLUMN caracteristicas_tecnicas text NOT NULL DEFAULT '',
ADD COLUMN capacidades_limitaciones text NOT NULL DEFAULT '',
ADD COLUMN certificado_url text;