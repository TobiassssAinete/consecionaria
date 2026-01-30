
-- ==========================================
-- 1. LIMPIEZA DE TRANSACCIONES
-- ==========================================
TRUNCATE sales CASCADE;
TRUNCATE vehicle_expenses CASCADE;
TRUNCATE vehicle_documents CASCADE;
TRUNCATE vehicles CASCADE;

-- ==========================================
-- 2. CARGA DE CATÁLOGOS MAESTROS
-- ==========================================
INSERT INTO catalog_doc_types (name, is_critical) 
VALUES 
('Título Digital (CAT)', true), ('Cédula Verde', true), ('Formulario 08D', true), 
('Verificación Policial (F12)', true), ('Grabado de Autopartes', true), ('VTV Vigente', false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_fuels (name) 
VALUES ('Nafta'), ('Diesel'), ('Híbrido (HEV)'), ('GNC'), ('Eléctrico')
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_transmissions (name) 
VALUES ('Manual'), ('Automática'), ('CVT'), ('eCVT (Híbrido)'), ('DSG / Doble Embrague'), ('Powershift')
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_colors (name) 
VALUES ('Blanco'), ('Negro'), ('Gris Plata'), ('Gris Oscuro'), ('Azul'), ('Rojo'), ('Beige'), ('Bronce')
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_expense_types (name)
VALUES ('Gestoría / Transferencia'), ('Mecánica General'), ('Service de Aceite'), ('Neumáticos'), ('Estética / Detailing'), ('Chapa y Pintura')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 3. BLOQUE DE CARGA: MARCAS Y MODELOS
-- ==========================================
DO $$
DECLARE
    v_brand_id UUID;
    v_model_id UUID;
BEGIN
    -- TOYOTA
    INSERT INTO catalog_brands (name) VALUES ('Toyota') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Corolla') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'XLI'), (v_model_id, 'XEI'), (v_model_id, 'SEG'), (v_model_id, 'GR-Sport'), (v_model_id, 'Hybrid XEI'), (v_model_id, 'Hybrid SEG') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Hilux') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'DX'), (v_model_id, 'SR'), (v_model_id, 'SRV'), (v_model_id, 'SRX'), (v_model_id, 'GR-Sport') ON CONFLICT (model_id, name) DO NOTHING;

    -- VOLKSWAGEN
    INSERT INTO catalog_brands (name) VALUES ('Volkswagen') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Gol Trend') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Trendline'), (v_model_id, 'Comfortline'), (v_model_id, 'Highline') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Amarok') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Trendline'), (v_model_id, 'Comfortline'), (v_model_id, 'Highline'), (v_model_id, 'Extreme'), (v_model_id, 'V6') ON CONFLICT (model_id, name) DO NOTHING;

    -- FORD
    INSERT INTO catalog_brands (name) VALUES ('Ford') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Focus') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'S'), (v_model_id, 'SE'), (v_model_id, 'SE Plus'), (v_model_id, 'Titanium') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Ranger') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'XL'), (v_model_id, 'XLS'), (v_model_id, 'XLT'), (v_model_id, 'Limited'), (v_model_id, 'Raptor') ON CONFLICT (model_id, name) DO NOTHING;

    -- CHEVROLET
    INSERT INTO catalog_brands (name) VALUES ('Chevrolet') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Onix') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Joy'), (v_model_id, 'LT'), (v_model_id, 'LTZ'), (v_model_id, 'Premier') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Cruze') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LT'), (v_model_id, 'LTZ'), (v_model_id, 'Premier') ON CONFLICT (model_id, name) DO NOTHING;

    -- FIAT
    INSERT INTO catalog_brands (name) VALUES ('Fiat') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Cronos') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Like'), (v_model_id, 'Drive'), (v_model_id, 'Precision') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Toro') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Freedom'), (v_model_id, 'Volcano'), (v_model_id, 'Ranch'), (v_model_id, 'Ultra') ON CONFLICT (model_id, name) DO NOTHING;

    -- RENAULT
    INSERT INTO catalog_brands (name) VALUES ('Renault') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Kwid') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Zen'), (v_model_id, 'Iconic'), (v_model_id, 'Outsider') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Sandero') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Expression'), (v_model_id, 'Privilege'), (v_model_id, 'RS') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Duster') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Expression'), (v_model_id, 'Dynamique'), (v_model_id, 'Privilege'), (v_model_id, 'Iconic') ON CONFLICT (model_id, name) DO NOTHING;

    -- PEUGEOT
    INSERT INTO catalog_brands (name) VALUES ('Peugeot') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, '208') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Like'), (v_model_id, 'Active'), (v_model_id, 'Allure'), (v_model_id, 'Feline'), (v_model_id, 'GT') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Partner') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Furgón'), (v_model_id, 'Patagónica') ON CONFLICT (model_id, name) DO NOTHING;

    -- CITROËN
    INSERT INTO catalog_brands (name) VALUES ('Citroën') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'C3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Live'), (v_model_id, 'Feel'), (v_model_id, 'Feel Pack'), (v_model_id, 'Shine'), (v_model_id, 'Origin') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'C4') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Lounge Live'), (v_model_id, 'Lounge Feel'), (v_model_id, 'Lounge Feel Pack'), (v_model_id, 'Lounge Shine'), (v_model_id, 'Hatchback') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Berlingo') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Furgón'), (v_model_id, 'Multispace') ON CONFLICT (model_id, name) DO NOTHING;

    -- NISSAN
    INSERT INTO catalog_brands (name) VALUES ('Nissan') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Frontier') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'S'), (v_model_id, 'SE'), (v_model_id, 'XE'), (v_model_id, 'LE'), (v_model_id, 'Platinum'), (v_model_id, 'Pro-4X') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Kicks') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Sense'), (v_model_id, 'Advance'), (v_model_id, 'Advance Plus'), (v_model_id, 'Exclusive'), (v_model_id, 'SR') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Versa') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Sense'), (v_model_id, 'Advance'), (v_model_id, 'Exclusive'), (v_model_id, 'SR') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'March') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Active'), (v_model_id, 'Sense'), (v_model_id, 'Advance'), (v_model_id, 'SR') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'X-Trail') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Sense'), (v_model_id, 'Advance'), (v_model_id, 'Exclusive'), (v_model_id, 'Tekna') ON CONFLICT (model_id, name) DO NOTHING;

    -- HONDA
    INSERT INTO catalog_brands (name) VALUES ('Honda') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'HR-V') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'EXL'), (v_model_id, 'Touring'), (v_model_id, 'Advance') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'CR-V') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'EXL'), (v_model_id, 'Touring'), (v_model_id, 'Hybrid') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Civic') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'EXT'), (v_model_id, 'EXL'), (v_model_id, 'Sport'), (v_model_id, 'Touring'), (v_model_id, 'Si'), (v_model_id, 'Type R') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'City') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'EXL'), (v_model_id, 'Touring') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Fit') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'EXL') ON CONFLICT (model_id, name) DO NOTHING;

    -- HYUNDAI
    INSERT INTO catalog_brands (name) VALUES ('Hyundai') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Tucson') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'GL'), (v_model_id, 'GLS'), (v_model_id, 'Limited'), (v_model_id, 'Ultimate') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Creta') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Comfort'), (v_model_id, 'Premium'), (v_model_id, 'Safety'), (v_model_id, 'Ultimate') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Santa Fe') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'GLS'), (v_model_id, 'Limited'), (v_model_id, 'Premium'), (v_model_id, 'Calligraphy') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Elantra') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'GLS'), (v_model_id, 'Limited'), (v_model_id, 'Sport'), (v_model_id, 'Hybrid') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'i10') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'GLS'), (v_model_id, 'Safety') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'i20') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Active'), (v_model_id, 'Premium') ON CONFLICT (model_id, name) DO NOTHING;

    -- KIA
    INSERT INTO catalog_brands (name) VALUES ('Kia') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Sportage') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'EX Pack'), (v_model_id, 'GT-Line') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Seltos') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'SX'), (v_model_id, 'GT-Line') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Sorento') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'EX'), (v_model_id, 'SX'), (v_model_id, 'SX Prestige'), (v_model_id, 'Hybrid') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Rio') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'EX Pack') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Picanto') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'LX'), (v_model_id, 'EX'), (v_model_id, 'GT-Line') ON CONFLICT (model_id, name) DO NOTHING;

    -- JEEP
    INSERT INTO catalog_brands (name) VALUES ('Jeep') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Renegade') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Sport'), (v_model_id, 'Longitude'), (v_model_id, 'Limited'), (v_model_id, 'Trailhawk'), (v_model_id, 'S'), (v_model_id, 'Night Eagle') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Compass') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Sport'), (v_model_id, 'Longitude'), (v_model_id, 'Limited'), (v_model_id, 'Trailhawk'), (v_model_id, 'S'), (v_model_id, 'Blackhawk') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Wrangler') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Sport'), (v_model_id, 'Sahara'), (v_model_id, 'Rubicon') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Commander') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Limited'), (v_model_id, 'Overland') ON CONFLICT (model_id, name) DO NOTHING;

    -- RAM
    INSERT INTO catalog_brands (name) VALUES ('RAM') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, '1500') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Laramie'), (v_model_id, 'Rebel'), (v_model_id, 'Limited'), (v_model_id, 'TRX') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, '2500') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Laramie'), (v_model_id, 'Heavy Duty') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, '3500') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Laramie'), (v_model_id, 'Heavy Duty') ON CONFLICT (model_id, name) DO NOTHING;

    -- MERCEDES-BENZ
    INSERT INTO catalog_brands (name) VALUES ('Mercedes-Benz') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Clase A') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'A200'), (v_model_id, 'A250'), (v_model_id, 'A35 AMG'), (v_model_id, 'A45 AMG') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Clase C') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'C180'), (v_model_id, 'C200'), (v_model_id, 'C300'), (v_model_id, 'C43 AMG') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'GLA') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'GLA 200'), (v_model_id, 'GLA 250'), (v_model_id, 'GLA 35 AMG') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'GLC') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'GLC 200'), (v_model_id, 'GLC 300'), (v_model_id, 'GLC 43 AMG') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Sprinter') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Furgón'), (v_model_id, 'Chasis'), (v_model_id, 'Minibus'), (v_model_id, 'Combi') ON CONFLICT (model_id, name) DO NOTHING;

    -- BMW
    INSERT INTO catalog_brands (name) VALUES ('BMW') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Serie 1') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, '118i'), (v_model_id, '120i'), (v_model_id, 'M135i') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Serie 3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, '320i'), (v_model_id, '330i'), (v_model_id, '340i'), (v_model_id, 'M3') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'X1') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'sDrive18i'), (v_model_id, 'sDrive20i'), (v_model_id, 'xDrive') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'X3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, '20i'), (v_model_id, '30i'), (v_model_id, 'M40i') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'X5') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'xDrive30d'), (v_model_id, 'xDrive40i'), (v_model_id, 'M') ON CONFLICT (model_id, name) DO NOTHING;

    -- AUDI
    INSERT INTO catalog_brands (name) VALUES ('Audi') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'A1') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Attraction'), (v_model_id, 'Ambition'), (v_model_id, 'S-Line') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'A3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Sedan'), (v_model_id, 'Sportback'), (v_model_id, 'S-Line') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'S3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Standard') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'RS3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Standard') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'A4') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Attraction'), (v_model_id, 'Advanced'), (v_model_id, 'S-Line') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Q3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Standard'), (v_model_id, 'S-Line') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'RS Q3') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Standard') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Q5') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Advanced'), (v_model_id, 'S-Line') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'SQ5') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Standard') ON CONFLICT (model_id, name) DO NOTHING;

    -- GWM
    INSERT INTO catalog_brands (name) VALUES ('GWM') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Haval H6') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Comfort'), (v_model_id, 'Premium'), (v_model_id, 'Supreme') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Haval Jolion') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Deluxe'), (v_model_id, 'Supreme') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Poer') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Elite'), (v_model_id, 'Deluxe') ON CONFLICT (model_id, name) DO NOTHING;

    -- CHERY
    INSERT INTO catalog_brands (name) VALUES ('Chery') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_id;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Tiggo 2') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Comfort'), (v_model_id, 'Luxury') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Tiggo 4 Pro') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Comfort'), (v_model_id, 'Luxury') ON CONFLICT (model_id, name) DO NOTHING;
    INSERT INTO catalog_models (brand_id, name) VALUES (v_brand_id, 'Tiggo 7 Pro') ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_model_id;
    INSERT INTO catalog_trims (model_id, name) VALUES (v_model_id, 'Luxury') ON CONFLICT (model_id, name) DO NOTHING;

END $$;
