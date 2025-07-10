ALTER TABLE products
ADD COLUMN product_id text,
ADD COLUMN name text,
ADD COLUMN type text,
ADD COLUMN ram integer,
ADD COLUMN storage integer,
ADD COLUMN price numeric(10,2),
ADD COLUMN stock text,
ADD COLUMN color text,
ADD COLUMN image text,
ADD COLUMN description text,
ADD COLUMN evaluate text;

UPDATE products
SET 
  product_id = metadata->>'product_id',
  name = metadata->>'name',
  type = metadata->>'type',
  ram = COALESCE(NULLIF((metadata->>'ram')::int, NULL), 0),
  storage = COALESCE(NULLIF((metadata->>'storage')::int, NULL), 0),
  price = (metadata->>'price')::numeric,
  stock = metadata->>'stock',
  color = metadata->>'color',
  image = metadata->>'image',
  description = metadata->>'description',
  evaluate = metadata->>'evaluate';

-- Index cho tìm kiếm theo loại sản phẩm (Macbook, Iphone, Ipad)
CREATE INDEX idx_products_type ON products(type);

-- Index cho tìm kiếm theo RAM
CREATE INDEX idx_products_ram ON products(ram);

-- Index cho tìm kiếm theo bộ nhớ
CREATE INDEX idx_products_storage ON products(storage);

-- Index cho tìm kiếm theo giá
CREATE INDEX idx_products_price ON products(price);

-- Index cho tìm kiếm theo màu sắc
CREATE INDEX idx_products_color ON products(color);

-- Index cho tìm kiếm theo tình trạng kho (còn hàng/hết hàng)
CREATE INDEX idx_products_stock ON products(stock);

-- Index cho tên sản phẩm (nếu hay search theo tên)
CREATE INDEX idx_products_name ON products(name);
