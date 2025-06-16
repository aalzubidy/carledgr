// VIN Decoder utility
import { validate } from 'vin-validator';

// VIN decoding utility
class VINDecoder {
  constructor() {
    // World Manufacturer Identifier (WMI) lookup table
    this.wmiTable = {
      // US Manufacturers
      '1G1': 'Chevrolet',
      '1G4': 'Buick',
      '1G6': 'Cadillac',
      '1GC': 'Chevrolet Truck',
      '1GT': 'GMC',
      '1FA': 'Ford',
      '1FB': 'Ford',
      '1FC': 'Ford',
      '1FD': 'Ford',
      '1FT': 'Ford Truck',
      '1FU': 'Freightliner',
      '1FV': 'Freightliner',
      '1G3': 'Oldsmobile',
      '1G8': 'Saturn',
      '1GK': 'GMC',
      '1GM': 'Pontiac',
      '1GY': 'Cadillac',
      '1HG': 'Honda',
      '1J4': 'Jeep',
      '1J8': 'Jeep',
      '1L1': 'Lincoln',
      '1LN': 'Lincoln',
      '1ME': 'Mercury',
      '1MH': 'Mercury',
      '1N4': 'Nissan',
      '1N6': 'Nissan Truck',
      '1NX': 'Toyota',
      '1VW': 'Volkswagen',
      '1YV': 'Mazda',
      '1ZV': 'Ford',
      '2C3': 'Chrysler',
      '2C4': 'Chrysler',
      '2C8': 'Chrysler',
      '2D3': 'Dodge',
      '2D4': 'Dodge',
      '2D8': 'Dodge',
      '2FA': 'Ford',
      '2FB': 'Ford',
      '2FC': 'Ford',
      '2FT': 'Ford Truck',
      '2G1': 'Chevrolet',
      '2G2': 'Pontiac',
      '2G3': 'Oldsmobile',
      '2G4': 'Buick',
      '2HG': 'Honda',
      '2HJ': 'Honda',
      '2HK': 'Honda',
      '2T1': 'Toyota',
      '2T2': 'Toyota',
      '3C3': 'Chrysler',
      '3C4': 'Chrysler',
      '3C6': 'Chrysler',
      '3C8': 'Chrysler',
      '3D3': 'Dodge',
      '3D4': 'Dodge',
      '3D7': 'Dodge',
      '3FA': 'Ford',
      '3FE': 'Ford',
      '3G1': 'Chevrolet',
      '3G3': 'Oldsmobile',
      '3G4': 'Buick',
      '3G5': 'Buick',
      '3G7': 'Pontiac',
      '3GY': 'Cadillac',
      '3HG': 'Honda',
      '3N1': 'Nissan',
      '3N6': 'Nissan',
      '3VW': 'Volkswagen',
      '4F2': 'Mazda',
      '4F4': 'Mazda',
      '4M2': 'Mercury',
      '4S3': 'Subaru',
      '4S4': 'Subaru',
      '4S6': 'Subaru',
      '4T1': 'Toyota',
      '4T3': 'Toyota',
      '4US': 'BMW',
      '5FN': 'Honda',
      '5FR': 'Honda',
      '5FY': 'Honda',
      '5GA': 'Buick',
      '5L1': 'Lincoln',
      '5NP': 'Hyundai',
      '5TD': 'Toyota',
      '5YJ': 'Tesla',
      '6F5': 'Nissan',
      '6G1': 'Chevrolet',
      '6G2': 'Pontiac',
      '6T1': 'Toyota',
      'WBA': 'BMW',
      'WBS': 'BMW',
      'WDD': 'Mercedes-Benz',
      'WDB': 'Mercedes-Benz',
      'WDC': 'Mercedes-Benz',
      'WMW': 'MINI',
      'WP0': 'Porsche',
      'WVW': 'Volkswagen',
      'WV1': 'Volkswagen',
      'WV2': 'Volkswagen',
      'WAU': 'Audi',
      'WA1': 'Audi',
      'YV1': 'Volvo',
      'YV4': 'Volvo',
      '9BW': 'Volvo'
    };

    // Year mapping for 10th character
    this.yearMap = {
      'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987,
      'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995,
      'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003,
      '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009, 'A': 2010, 'B': 2011,
      'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026, 'V': 2027,
      'W': 2028, 'X': 2029, 'Y': 2030
    };
  }

  // Validate VIN format
  isValidVIN(vin) {
    if (!vin || typeof vin !== 'string') return false;
    
    // Remove spaces and convert to uppercase
    vin = vin.replace(/\s/g, '').toUpperCase();
    
    // Check basic format
    if (vin.length !== 17) return false;
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
    
    try {
      return validate(vin);
    } catch (error) {
      console.warn('VIN validation error:', error);
      return vin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
    }
  }

  // Extract year from VIN
  getYear(vin) {
    if (!this.isValidVIN(vin)) return null;
    
    const yearChar = vin.charAt(9);
    return this.yearMap[yearChar] || null;
  }

  // Extract make from VIN using WMI
  getMake(vin) {
    if (!this.isValidVIN(vin)) return null;
    
    const wmi = vin.substring(0, 3);
    return this.wmiTable[wmi] || null;
  }

  // Basic VIN decoding
  decodeBasic(vin) {
    vin = vin.replace(/\s/g, '').toUpperCase();
    
    if (!this.isValidVIN(vin)) {
      throw new Error('Invalid VIN format');
    }

    const make = this.getMake(vin);
    const year = this.getYear(vin);

    return {
      vin: vin,
      make: make,
      year: year,
      model: null, // Will be filled by API call
      color: null, // Will be filled by API call
      isValid: true
    };
  }

  // Decode VIN using external API (NHTSA)
  async decodeWithAPI(vin) {
    try {
      vin = vin.replace(/\s/g, '').toUpperCase();
      
      if (!this.isValidVIN(vin)) {
        throw new Error('Invalid VIN format');
      }

      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
      
      if (!response.ok) {
        throw new Error('Failed to decode VIN via API');
      }

      const data = await response.json();
      
      if (!data.Results || data.Results.length === 0) {
        throw new Error('No VIN data found');
      }

      // Parse API response
      const results = {};
      data.Results.forEach(item => {
        if (item.Value && item.Value !== 'Not Applicable' && item.Value !== '') {
          results[item.Variable] = item.Value;
        }
      });

      return {
        vin: vin,
        make: results['Make'] || this.getMake(vin),
        model: results['Model'] || null,
        year: parseInt(results['Model Year']) || this.getYear(vin),
        color: results['Color'] || null,
        bodyClass: results['Body Class'] || null,
        engineSize: results['Engine Number of Cylinders'] || null,
        fuelType: results['Fuel Type - Primary'] || null,
        transmission: results['Transmission Style'] || null,
        isValid: true,
        source: 'NHTSA API'
      };
    } catch (error) {
      console.warn('API decode failed, falling back to basic decode:', error);
      // Fallback to basic decoding
      return this.decodeBasic(vin);
    }
  }

  // Main decode function - tries API first, falls back to basic
  async decode(vin) {
    try {
      return await this.decodeWithAPI(vin);
    } catch (error) {
      console.warn('Full decode failed:', error);
      return this.decodeBasic(vin);
    }
  }
}

// Create singleton instance
const vinDecoder = new VINDecoder();

export { vinDecoder };
export default vinDecoder; 