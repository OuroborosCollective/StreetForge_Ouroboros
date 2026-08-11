ALTER TABLE `city_district_states` ADD COLUMN `control` enum('neutral','enemy','raider','safe','police') NOT NULL DEFAULT 'neutral';
--> statement-breakpoint
UPDATE `city_district_states`
SET `control` = CASE `districtKey`
  WHEN 'district.west-end-yard' THEN 'neutral'
  WHEN 'district.slate-market' THEN 'safe'
  WHEN 'district.low-line' THEN 'raider'
  WHEN 'district.needle-roofs' THEN 'enemy'
  WHEN 'district.sentinel-precinct' THEN 'police'
  ELSE `control`
END;
