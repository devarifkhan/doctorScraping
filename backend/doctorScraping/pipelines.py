import logging
import psycopg2
from itemadapter import ItemAdapter

logger = logging.getLogger(__name__)


class DoctorscrapingPipeline:

    def __init__(self, database_url):
        self.database_url = database_url

    @classmethod
    def from_crawler(cls, crawler):
        return cls(database_url=crawler.settings.get('DATABASE_URL'))

    def open_spider(self, spider):
        self.connection = psycopg2.connect(self.database_url)
        self.cursor = self.connection.cursor()
        self._create_table()
        logger.info("Connected to PostgreSQL database.")

    def _create_table(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS doctors (
                id SERIAL PRIMARY KEY,
                name TEXT,
                specialty TEXT,
                url TEXT UNIQUE,
                image_url TEXT,
                raw_data TEXT,
                source TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        self.connection.commit()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        try:
            self.cursor.execute(
                """
                INSERT INTO doctors (name, specialty, url, image_url, raw_data, source)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING;
                """,
                (
                    adapter.get('name'),
                    adapter.get('specialty'),
                    adapter.get('url'),
                    adapter.get('image_url'),
                    adapter.get('raw_data'),
                    spider.name,
                ),
            )
            self.connection.commit()
        except Exception as e:
            self.connection.rollback()
            logger.error("Failed to insert item (url=%s): %s", adapter.get('url'), e)
        return item

    def close_spider(self, spider):
        self.cursor.close()
        self.connection.close()
        logger.info("Database connection closed.")
