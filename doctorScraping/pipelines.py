# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import mysql.connector


class DoctorscrapingPipeline:
    
    def __init__(self, host, user, password, database):
        self.host = host
        self.user = user
        self.password = password
        self.database = database

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            host=crawler.settings.get('MYSQL_HOST'),
            user=crawler.settings.get('MYSQL_USER'),
            password=crawler.settings.get('MYSQL_PASSWORD'),
            database=crawler.settings.get('MYSQL_DATABASE'),
        )
        
    def open_spider(self, spider):
        self.connection = mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database
        )
        self.cursor = self.connection.cursor()

    def close_spider(self, spider):
        self.connection.commit()
        self.cursor.close()
        self.connection.close()
    def process_item(self, item, spider):
        return item
    
    def insert_into_mysql(self, item):
        insert_query = f"""
        INSERT INTO doctors (name, specialty, url, image_url, raw_data) 
        VALUES (%(name)s, %(specialty)s, %(url)s, %(image_url)s, %(raw_data)s);
        """

        self.cursor.execute(insert_query, item)
