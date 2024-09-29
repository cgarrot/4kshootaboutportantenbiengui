#!/usr/bin/python -u
# -*- coding: utf-8 -*-

import urllib.request, urllib.error
import sys
import json
import os
import logging
import socket

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
GR_HOST = "http://192.168.0.1/"
PHOTO_LIST_URI = "v1/photos"
DOWNLOAD_DIR = "downloads"

# Set a timeout for URL requests
socket.setdefaulttimeout(10)  # 10 seconds timeout

def get_photo_list():
    logging.debug("Fetching photo list from Ricoh GR III")
    req = urllib.request.Request(GR_HOST + PHOTO_LIST_URI)
    try:
        logging.debug(f"Sending request to {GR_HOST + PHOTO_LIST_URI}")
        resp = urllib.request.urlopen(req)
        logging.debug("Response received")
        data = resp.read()
        photo_dict = json.loads(data)
        if photo_dict['errCode'] != 200:
            logging.error(f"Error code: {photo_dict['errCode']}, Error message: {photo_dict['errMsg']}")
            return []
        else:
            photo_list = []
            for dir_info in photo_dict['dirs']:
                for file in dir_info['files']:
                    photo_list.append(f"{dir_info['name']}/{file}")
            return photo_list
    except urllib.error.URLError as e:
        logging.error(f"Unable to fetch photo list from Ricoh GR III: {e}")
        return []
    except socket.timeout:
        logging.error("Connection timed out while fetching photo list")
        return []
    except Exception as e:
        logging.error(f"Unexpected error occurred: {e}")
        return []

def download_last_photo(photo_uri):
    logging.debug(f"Downloading last photo: {photo_uri}")
    try:
        f = urllib.request.urlopen(GR_HOST + PHOTO_LIST_URI + '/' + photo_uri)
        if not os.path.exists(DOWNLOAD_DIR):
            os.makedirs(DOWNLOAD_DIR)
        file_name = os.path.join(DOWNLOAD_DIR, os.path.basename(photo_uri))
        with open(file_name, "wb") as local_file:
            local_file.write(f.read())
        logging.info(f"Last photo downloaded: {file_name}")
        return True
    except urllib.error.URLError as e:
        logging.error(f"Failed to download last photo: {e}")
        return False

def main():
    logging.info("Starting Ricoh GR III image retrieval script")
    
    # Test connection before fetching photo list
    try:
        logging.debug("Testing connection to camera")
        urllib.request.urlopen(GR_HOST, timeout=5)
        logging.debug("Connection successful")
    except Exception as e:
        logging.error(f"Failed to connect to camera: {e}")
        print("Unable to connect to the camera. Please check your connection and try again.")
        return

    photo_list = get_photo_list()
    total_photos = len(photo_list)
    
    print(f"Total number of images on Ricoh GR III: {total_photos}")
    logging.info(f"Total number of images: {total_photos}")
    
    if total_photos > 0:
        last_photo = photo_list[-1]
        if download_last_photo(last_photo):
            print(f"Last photo ({last_photo}) has been downloaded to the '{DOWNLOAD_DIR}' folder.")
        else:
            print("Failed to download the last photo.")
    else:
        print("No photos found on the Ricoh GR III.")
    
    logging.info("Script execution completed")

if __name__ == "__main__":
    main()