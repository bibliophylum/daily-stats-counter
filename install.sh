echo Disabling existing site...
sudo a2dissite dsc.conf

echo Unlinking DSC configuration...
sudo unlink /etc/apache2/sites-available/dsc.conf

echo Removing existing /opt/dsc...
# want to preserve logs, database
sudo rm -rf /opt/dsc/bin
sudo rm -rf /opt/dsc/devdocs
sudo rm -rf /opt/dsc/externals
sudo rm -rf /opt/dsc/htdocs
sudo rm -rf /opt/dsc/modules
sudo rm -rf /opt/dsc/conf

echo Copying files...
cp -rv bin /opt/dsc/
cp -rv externals /opt/dsc/
cp -rv htdocs /opt/dsc/
cp -rv modules /opt/dsc/
cp -rv conf /opt/dsc/

echo Creating symlink to apache sites-available...
sudo ln -s /opt/dsc/conf/dsc.conf /etc/apache2/sites-available/dsc.conf

echo Enabling site...
sudo a2ensite dsc.conf

echo Reloading apache...
sudo /etc/init.d/apache2 reload

echo Done.
