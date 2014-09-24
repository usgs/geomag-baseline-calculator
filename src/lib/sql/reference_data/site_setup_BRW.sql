/* BRW - add observatory entry */ 
INSERT INTO observatory (name, code, location, latitude, longitude, geomagnetic_latitude, geomagnetic_longitude, elevation, orientation)
 VALUES ('Barrow (BRW)','BRW' ,'Point Barrow, AK','71.3225' ,'-156.6231' ,'69.61' ,'246.26' ,'12' ,'HDZF');

/* get id of newly-added observatory row */
SELECT id FROM observatory WHERE code='BRW' INTO @observatory_id;
 
/* add BRW's current instruments - Inst. No., 359137/0145 */
INSERT INTO instrument (observatory_id, serial_number, begin, end, name, type)
VALUES ( @observatory_id, '359137', 1000*unix_timestamp('1970-01-01 00:00:00'), NULL, 'Electronics', 'elec');
INSERT INTO instrument (observatory_id, serial_number, begin, end, name, type)
VALUES ( @observatory_id, '0145', 1000*unix_timestamp('1970-01-01 00:00:00'), NULL, 'Theodolite', 'theo');

/* add pier=Main */
INSERT INTO PIER (observatory_id, name, begin, end, correction, default_mark_id, default_electronics_id, default_theodolite_id)
VALUES ( @observatory_id, 'Main', 1000*unix_timestamp('1970-01-01 00:00:00'), NULL, -1, NULL,
         ( SELECT id FROM instrument WHERE observatory_id=@observatory_id AND serial_number='359137' AND begin=1000*unix_timestamp('1970-01-01 00:00:00') ),
         ( SELECT id FROM instrument WHERE observatory_id=@observatory_id AND serial_number='0145' AND begin=1000*unix_timestamp('1970-01-01 00:00:00') )
);

/* set observatory.default_pier_id to Main */
SELECT id 
FROM pier
WHERE observatory_id=@observatory_id
  AND name = 'Main'
  AND begin = 1000*unix_timestamp('1970-01-01 00:00:00')
INTO @default_pier_id;
                                  
UPDATE observatory
SET default_pier_id = @default_pier_id
WHERE code = 'BRW'; 

/* add Mark='New Azimuth' */
INSERT INTO mark (pier_id, name, begin, end, azimuth) 
VALUES ( 
  (SELECT id FROM pier WHERE observatory_id=@observatory_id
                         AND name='Main' 
                         AND begin = 1000*unix_timestamp('1970-01-01 00:00:00') ),
   'New Azimuth', 1000*unix_timestamp('1970-01-01 00:00:00'), NULL, 7.965
);

/* update pier.default_mark_id */
SELECT id
FROM pier 
WHERE observatory_id=@observatory_id
  AND name='Main'
  AND begin = 1000*unix_timestamp('1970-01-01 00:00:00')
INTO @pier_id;

SELECT id
FROM mark
WHERE name = 'New Azimuth'
  AND begin = 1000*unix_timestamp('1970-01-01 00:00:00')
  AND pier_id = @pier_id
INTO @default_mark_id;

UPDATE PIER SET default_mark_id = @default_mark_id
WHERE id = @pier_id;