# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class DoctorscrapingItem(scrapy.Item):
    # define the fields for your item here like:
    name = scrapy.Field()
    specialty = scrapy.Field()
    url = scrapy.Field()
    image_url = scrapy.Field()
    raw_data = scrapy.Field()

