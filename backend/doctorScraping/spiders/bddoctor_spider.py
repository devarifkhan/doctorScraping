import scrapy
from doctorScraping.items import DoctorscrapingItem


class BddoctorSpiderSpider(scrapy.Spider):
    name = 'bddoctor_spider'
    allowed_domains = ['doctorbangladesh.com']
    start_urls = ['https://www.doctorbangladesh.com/doctors-dhaka/']

    def parse(self, response):
        links = response.css('.list li a::attr(href)').getall()
        self.logger.info("Found %d specialty links on %s", len(links), response.url)
        for link in links:
            yield scrapy.Request(url=link, callback=self.parse_doctor)

    def parse_doctor(self, response):
        doctors = response.css('ul.doctors li.doctor')
        for doctor in doctors:
            doctor_name = doctor.css('.title a::text').get()
            chamber_link = doctor.css('.info a.call-now::attr(href)').get()

            if not chamber_link:
                self.logger.warning("No chamber link for doctor '%s' — skipping.", doctor_name)
                continue

            yield scrapy.Request(
                url=chamber_link,
                callback=self.parse_chamber,
                meta={'doctor_name': doctor_name, 'chamber_link': chamber_link},
                errback=self.handle_error,
            )

    def parse_chamber(self, response):
        doctor_name = response.meta['doctor_name']

        degree_and_specialty = response.css(
            '.entry-header ul li[title="Degree"]::text, .entry-header ul li.speciality::text'
        ).getall()
        doctor_degree = degree_and_specialty[0].strip() if degree_and_specialty else None
        doctor_specialty = degree_and_specialty[1].strip() if len(degree_and_specialty) > 1 else None

        chamber_info = response.css(
            'h2:contains("Chamber & Appointment") + p strong a::text, '
            'h2:contains("Chamber & Appointment") + p::text'
        ).getall()
        chamber_name = chamber_info[0].strip() if chamber_info else None
        chamber_address = chamber_info[1].strip() if len(chamber_info) > 1 else None

        doctor_image_url = response.css('.entry-header .photo img::attr(src)').get()

        self.logger.info("Scraped doctor: %s", doctor_name)

        item = DoctorscrapingItem()
        item['name'] = doctor_name
        item['specialty'] = doctor_specialty
        item['url'] = response.meta['chamber_link']
        item['image_url'] = doctor_image_url
        item['raw_data'] = f'ChamberName: {chamber_name} Degree: {doctor_degree} Address: {chamber_address}'
        yield item

    def handle_error(self, failure):
        self.logger.error("Request failed: %s", failure.request.url)
