<?php
?>
    <footer class="fnf-footer bg-black text-white p-8 mt-12">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
                <h3 class="text-xl font-bold mb-4 text-red-600">JOIN OUR LOYALTY PROGRAM</h3>
                <form class="flex flex-col gap-4">
                    <input type="text" placeholder="Name" class="p-2 bg-gray-800 rounded border border-gray-700" />
                    <input type="email" placeholder="Email" class="p-2 bg-gray-800 rounded border border-gray-700" />
                    <input type="tel" placeholder="Phone" class="p-2 bg-gray-800 rounded border border-gray-700" />
                    <button type="submit" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">JOIN NOW</button>
                </form>
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4 text-red-600">LOCATIONS</h3>
                <p>Las Vegas, NV</p>
                <p>Atlanta, GA</p>
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4 text-red-600">CONTACT US</h3>
                <p>info@finandfeathers.com</p>
            </div>
        </div>
        <div class="text-center mt-8 border-t border-gray-800 pt-8 text-gray-500 text-sm">
            &copy; <?php echo date('Y'); ?> Fin & Feathers. All rights reserved.
        </div>
    </footer>
    <?php wp_footer(); ?>
</body>
</html>
