# 使用官方 PHP + Apache 映像檔
FROM php:8.2-apache

# 1. 處理系統依賴與 PHP 擴展
# 注意：fileinfo 在官方 PHP 映像檔中通常是預設啟用的，
# 如果你需要其他擴展（如 gd, pdo_mysql）才需要在此安裝。
#RUN apt-get update && apt-get install -y \
    #libzip-dev \
    #&& docker-php-ext-install zip \
    #&& apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. 修改 Apache 設定以符合 Cloud Run 需求
# Cloud Run 會提供 $PORT 環境變數，通常是 8080
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# 3. 複製程式碼並設定權限
WORKDIR /var/www/html
COPY . .

# 建立上傳資料夾並調整權限
# 建議將擁有者改為 www-data（Apache 預設使用者），比 777 更安全
RUN mkdir -p uploads && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html/uploads

# 啟動 Apache
CMD ["apache2-foreground"]
