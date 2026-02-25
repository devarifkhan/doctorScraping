import scrapy
from doctorScraping.items import DoctorscrapingItem

BASE_URL = 'https://www.ibnsinatrust.com'


class IbnsinaSpiderSpider(scrapy.Spider):
    name = 'ibnsina_spider'
    allowed_domains = ['ibnsinatrust.com']
    start_urls = [
        f'{BASE_URL}/view_doctor_profile_up.php?id={i}' for i in range(1, 3000)
    ]

    def parse(self, response):
        name = response.xpath(
            '//p[@style="color:#00E; font-weight:bold;"]/text()'
        ).get()
        specialty = response.xpath(
            '//b[text()="Qualifications:"]/following-sibling::text()'
        ).get()
        address_parts = response.xpath(
            '//b[contains(text(), "Branch Name & Address")]/following-sibling::text()'
        ).getall()
        appointment = response.xpath(
            '//b[text()=" Appointment: "]/following-sibling::text()'
        ).get()
        designation = response.xpath(
            '//b[contains(text(), "Designation")]/following-sibling::text()'
        ).get()
        institute = response.xpath(
            '//b[contains(text(), "Institute")]/following-sibling::text()'
        ).get()
        image_path = response.xpath(
            '//img[@class="img-responsive center-block"]/@src'
        ).get()

        # Only yield records that have all required fields
        required = [name, specialty, appointment, designation, institute, image_path]
        if not all(v and str(v).strip() not in ('', 'None') for v in required):
            return

        address = ' '.join(address_parts).strip() if address_parts else None
        specialty = specialty.strip()
        appointment = appointment.strip()
        designation = designation.strip()
        institute = institute.strip()

        item = DoctorscrapingItem()
        item['name'] = name
        item['specialty'] = specialty
        item['url'] = response.url
        item['image_url'] = f'{BASE_URL}/{image_path}'
        item['raw_data'] = (
            f'Address: {address}, Appointment: {appointment}, '
            f'Designation: {designation}, Institute: {institute}'
        )
        yield item
