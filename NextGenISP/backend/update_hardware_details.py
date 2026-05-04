import os
import django
import sys
import json

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import Hardware

def seed_hardware_details():
    hardwares = Hardware.objects.all()
    count = 0
    
    for hw in hardwares:
        name = hw.name.lower()
        
        if "tp-link" in name or "wr820n" in name:
            hw.hero_tagline = "Your Fast, Everyday Wi-Fi Essential"
            hw.features = "300 Mbps Wi-Fi,IPTV Support,Guest Network,Compact White Design"
            hw.specifications = json.dumps({
                "Wireless Standard": "Wi-Fi 4 (802.11n)",
                "Bands": "Single-Band (2.4 GHz)",
                "Max Speed": "Up to 300 Mbps",
                "Antennas": "2x 5dBi Fixed Antennas",
                "Ports": "2x 10/100 LAN, 1x 10/100 WAN",
                "Security": "WPA2 Personal"
            })
        elif "dual" in name or "gigabit" in name:
            hw.hero_tagline = "The Perfect Balance of Speed and Value"
            hw.features = "Dual-Band Wi-Fi,MU-MIMO Technology,Easy App Management,Guest Network"
            hw.specifications = json.dumps({
                "Wireless Standard": "Wi-Fi 5 (802.11ac)",
                "Bands": "Dual-Band (2.4 GHz, 5 GHz)",
                "Max Speed": "1200 Mbps (300 + 867)",
                "Antennas": "4x External Antennas",
                "Ports": "4x Gigabit LAN, 1x Gigabit WAN",
                "Security": "WPA2 Enterprise"
            })
        else: # Catch all for ONU / Modem / Gaming / Mesh
            hw.hero_tagline = "Premium Performance & Ultimate Reliability"
            hw.features = "Fiber-Optic Ready,Plug & Play Setup,Compact Design,Energy Efficient"
            hw.specifications = json.dumps({
                "Hardware Type": "Optical Network Unit (ONU) / Modem",
                "Ports": "1x Gigabit LAN, 1x PON",
                "Max Speed": "Up to 1000 Mbps",
                "Compatibility": "All major Fiber ISPs",
                "Power Supply": "12V/0.5A"
            })
            
        hw.save()
        print(f"✅ Updated details for: {hw.name}")
        count += 1
            
    print(f"\n🎉 Successfully enriched {count} hardware items!")

if __name__ == '__main__':
    seed_hardware_details()
