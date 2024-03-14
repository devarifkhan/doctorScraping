import scrapy
import mysql.connector

class BddoctorSpiderSpider(scrapy.Spider):
    name = 'bddoctor_spider'
    allowed_domains = ['doctorbangladesh.com']
    start_urls = ['https://www.doctorbangladesh.com/doctors-dhaka/']

    def parse(self, response):
        # Extracting links from the <ul> element with class 'list'
        links = response.css('.list li a::attr(href)').extract()

        # Follow each link to the doctor's page
        for link in links:
            yield scrapy.Request(url=link, callback=self.parse_doctor)

    def parse_doctor(self, response):
        # Extract information for each doctor on the page
        doctors = response.css('ul.doctors li.doctor')
        for doctor in doctors:
            doctor_name = doctor.css('.title a::text').get()
            chamber_link = doctor.css('.info a.call-now::attr(href)').get()

            # Follow the chamber link to scrape additional information
            yield scrapy.Request(url=chamber_link, callback=self.parse_chamber,
                                 meta={'doctor_name': doctor_name, 'chamber_link': chamber_link})

    def parse_chamber(self, response):
        # Extract information from the chamber page
        doctor_name = response.meta['doctor_name']

        # Parse the doctor's degree and specialty
        degree_and_specialty = response.css('.entry-header ul li[title="Degree"]::text, .entry-header ul li.speciality::text').getall()
        doctor_degree = degree_and_specialty[0].strip() if degree_and_specialty else None
        doctor_specialty = degree_and_specialty[1].strip() if len(degree_and_specialty) > 1 else None

        # Extract chamber name and address
        chamber_info = response.css('h2:contains("Chamber & Appointment") + p strong a::text, h2:contains("Chamber & Appointment") + p::text').getall()
        chamber_name = chamber_info[0].strip() if chamber_info else None
        chamber_address = chamber_info[1].strip() if len(chamber_info) > 1 else None

        # Extract doctor image URL directly in parse_chamber
        doctor_image_url = response.css('.entry-header .photo img::attr(src)').get()
        
        # Create a dictionary similar to doctor_info
        doctor_item = {
            'name': doctor_name,
            'specialty': doctor_specialty,
            'url': response.meta['chamber_link'],
            'image_url': doctor_image_url,
            'raw_data': f'ChamberName: {chamber_name} Degree:{doctor_degree} Address:{chamber_address}',
        }
        
        
        self.insert_into_mysql(doctor_item)

        # Yield the data for the chamber
        yield {
            'name': doctor_name,
            'specialty': doctor_specialty,
            'url': response.meta['chamber_link'],
            'image_url': doctor_image_url,
            'raw_data': f'ChamberName: {chamber_name} Degree:{doctor_degree} Address:{chamber_address}',
        }
    def insert_into_mysql(self, item):
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='toor',
            database='doctordb'
        )
        cursor = connection.cursor()

        insert_query = """
        INSERT INTO doctors (name, specialty, url, image_url, raw_data) 
        VALUES (%s, %s, %s, %s, %s);
        """

        cursor.execute(insert_query, (item['name'], item['specialty'], item['url'], item['image_url'], item['raw_data']))

        connection.commit()
        cursor.close()
        connection.close()