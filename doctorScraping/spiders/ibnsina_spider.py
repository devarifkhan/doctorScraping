import scrapy
import mysql.connector


class IbnsinaSpiderSpider(scrapy.Spider):
    name = 'ibnsina_spider'
    allowed_domains = ['ibnsinatrust.com']
    start_urls = ['https://www.ibnsinatrust.com/view_doctor_profile_up.php?id={}'.format(i) for i in range(1, 3000)]
    # start_urls = ['https://www.ibnsinatrust.com/view_doctor_profile_up.php?id=43']
    

    def parse(self, response):
        doctor_info = {}

        # Extracting data using XPath selectors
        name_xpath = '//p[@style="color:#00E; font-weight:bold;"]/text()'
        doctor_info['name'] = response.xpath(name_xpath).get()

        # Qualifications
        qualifications_xpath = '//b[text()="Qualifications:"]/following-sibling::text()'
        qualifications_text = response.xpath(qualifications_xpath).get()
        doctor_info['specialty'] = qualifications_text.strip() if qualifications_text else None

        # Current URL
        doctor_info['current_url'] = response.url

        # Extract 'Branch Name & Address' information using XPath
        address_xpath = '//b[contains(text(), "Branch Name & Address")]/following-sibling::text()'
        address_text = response.xpath(address_xpath).getall()
        address = ' '.join(address_text).strip() if address_text else None

        # Extract 'Appointment' information using XPath
        appointment_xpath = '//b[text()=" Appointment: "]/following-sibling::text()'
        appointment_text = response.xpath(appointment_xpath).get()
        doctor_info['appointment'] = appointment_text.strip() if appointment_text else None

        # Extract 'Designation' information using XPath
        designation_xpath = '//b[contains(text(), "Designation")]/following-sibling::text()'
        designation_text = response.xpath(designation_xpath).get()
        doctor_info['designation'] = designation_text.strip() if designation_text else None

        # Extract 'Institute' information using a more flexible XPath
        institute_xpath = '//b[contains(text(), "Institute")]/following-sibling::text()'
        institute_text = response.xpath(institute_xpath).get()
        doctor_info['institute'] = institute_text.strip() if institute_text else None

        # Extract image URL
        img_xpath = '//img[@class="img-responsive center-block"]/@src'
        doctor_info['image_url'] = response.xpath(img_xpath).get()

        # Check if all required fields have values
        if all(value is not None and str(value) != 'None' for value in [doctor_info['name'], doctor_info['specialty'], doctor_info['current_url'], address, doctor_info['appointment'], doctor_info['designation'], doctor_info['institute'], doctor_info['image_url']]):
            # Combine 'Appointment', 'Branch Name & Address', 'Designation', and 'Institute' into a single string within 'raw_data'
            doctor_info['raw_data'] = f"Address: {address}, Appointment: {doctor_info['appointment']}, Designation: {doctor_info['designation']}, Institute: {doctor_info['institute']}"

            # Print or do something with the modified extracted data
            print(doctor_info)
            
            self.insert_into_mysql(doctor_info)

            # Yield the specified fields including image_url
            yield {
                'name': doctor_info['name'],
                'specialty': doctor_info['specialty'],
                'url': doctor_info['current_url'],
                'image_url': 'https://www.ibnsinatrust.com/'+doctor_info['image_url'],
                'raw_data': doctor_info['raw_data'],
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

        cursor.execute(insert_query, (item['name'], item['specialty'], item['current_url'], item['image_url'], item['raw_data']))

        connection.commit()
        cursor.close()
        connection.close()