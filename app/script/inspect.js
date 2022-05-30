'use strict'

const scriptHost = process.env.server

module.exports = `#!/usr/bin/env bash

# check for root privilages
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

CACHE_DIR="/var/cache/snowflake"
CACHE_FILE="$CACHE_DIR/sysinfo.json"
UPLOADED="$CACHE_DIR/uploaded"

# create cache dir if it doesn't exist
mkdir -p $CACHE_DIR

function scan(){
  # populate variables
  BIOS_VENDOR=$(dmidecode -s bios-vendor)
  BIOS_VERSION=$(dmidecode -s bios-version)
  BIOS_RELEASE_DATE=$(dmidecode -s bios-release-date)
  SYSTEM_MANUFACTURER=$(dmidecode -s system-manufacturer)
  SYSTEM_PRODUCT_NAME=$(dmidecode -s system-product-name)
  SYSTEM_VERSION=$(dmidecode -s system-version)
  SYSTEM_SERIAL_NUMBER=$(dmidecode -s system-serial-number)
  BASEBOARD_MANUFACTURER=$(dmidecode -s baseboard-manufacturer)
  BASEBOARD_PRODUCT_NAME=$(dmidecode -s baseboard-product-name)
  BASEBOARD_VERSION=$(dmidecode -s baseboard-version)
  BASEBOARD_SERIAL_NUMBER=$(dmidecode -s baseboard-serial-number)
  CHASSIS_MANUFACTURER=$(dmidecode -s chassis-manufacturer)
  CHASSIS_TYPE=$(dmidecode -s chassis-type)
  CHASSIS_VERSION=$(dmidecode -s chassis-version)
  CHASSIS_SERIAL_NUMBER=$(dmidecode -s chassis-serial-number)
  PROCESSOR_FAMILY=$(dmidecode -s processor-family)
  PROCESSOR_MANUFACTURER=$(dmidecode -s processor-manufacturer)
  PROCESSOR_VERSION=$(dmidecode -s processor-version)
  PROCESSOR_FREQUENCY=$(dmidecode -s processor-frequency)

  # populate network details
  # pipe through sed to work around lshw bug https://github.com/lyonel/lshw/pull/28 
  NET_MAP=$(lshw -quiet -c network -json | sed 's/^\\s*}\\s*{\\s*$/},{/')

  # construct JSON string
  JSON_STRING=$(cat << EOF
{
  "biosVendor":"$BIOS_VENDOR",
  "biosVersion":"$BIOS_VERSION",
  "biosReleaseDate":"$BIOS_RELEASE_DATE",
  "systemManufacturer":"$SYSTEM_MANUFACTURER",
  "systemProductName":"$SYSTEM_PRODUCT_NAME",
  "systemVersion":"$SYSTEM_VERSION",
  "systemSerialNumber":"$SYSTEM_SERIAL_NUMBER",
  "baseboardManufacturer":"$BASEBOARD_MANUFACTURER",
  "baseboardProductName":"$BASEBOARD_PRODUCT_NAME",
  "baseboardVersion":"$BASEBOARD_VERSION",
  "baseboardSerialNumber":"$BASEBOARD_SERIAL_NUMBER",
  "chassisManufacturer":"$CHASSIS_MANUFACTURER",
  "chassisType":"$CHASSIS_TYPE",
  "chassisVersion":"$CHASSIS_VERSION",
  "chassisSerialNumber":"$CHASSIS_SERIAL_NUMBER",
  "processorFamily":"$PROCESSOR_FAMILY",
  "processorManufacturer":"$PROCESSOR_MANUFACTURER",
  "processorVersion":"$PROCESSOR_VERSION",
  "processorFrequency":"$PROCESSOR_FREQUENCY",
  "networks":[
    $NET_MAP
  ]
}
EOF
)

  JSON=$(echo $JSON_STRING | python -m json.tool)
  if [ $? -eq 0 ]; then
    echo $JSON > $CACHE_FILE
  else
    echo "Error converting sysinfo to JSON."
    exit 1
  fi
}



# check if system scan already cached
if [ -f $CACHE_FILE ]; then
    echo "Skipping system scan, reading scan from cache: $CACHE_FILE"
else
  scan
fi

if [ -f $UPLOADED ];then
  echo "Skipping upload, sysinfo already uploaded."
else
  STATUSCODE=$(curl -L -s --request POST --write-out "%{http_code}" --output /dev/stderr -H "Content-Type: application/json" --data @$CACHE_FILE http://${scriptHost}/api/devices)
  if [ $? -eq 0 ] && [ $STATUSCODE -eq 200 ]; then
    touch $UPLOADED
    echo ""
  else
    echo ""
    echo "Could not upload sysinfo."
  fi
fi
`