# --- !Ups


ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_description` `article_description` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ;



# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_description` `article_description` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ;
