# 使用官方 PHP + Apache 映像檔
FROM php:8.2-apache

# 安裝必要的擴展 (finfo 需要的)
RUN apt-get update && apt-get install -y \
    libmagic-dev \
    && docker-php-ext-install fileinfo

# 修改 Apache 設定，讓它聽 Cloud Run 指定的 $PORT (通常是 8080)
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# 複製程式碼到容器
COPY . /var/www/html/

# 確保 uploads 資料夾存在且可寫入
RUN mkdir -p /var/www/html/uploads && chmod -R 777 /var/www/html/uploads

# 啟動 Apache
CMD ["apache2-foreground"]
